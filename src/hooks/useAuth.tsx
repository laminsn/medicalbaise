import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { getBaiseAppKey } from '@/lib/providerCommunication';
import { buildAuthCallbackUrl, resolveSignupIntent } from '@/lib/postAuthDestination';

interface Profile {
  id: string;
  user_id: string;
  user_type: 'customer' | 'provider';
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  referral_code: string | null;
  referral_slug?: string | null;
  client_id?: string | null;
  signup_app_key?: 'casa' | 'medical' | 'legal' | null;
  credits_balance: number;
  status: string | null;
  bio: string | null;
  languages: string[] | null;
  handle: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName?: string, lastName?: string, languages?: string[]) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const db = supabase as any;

function getStoredAttribution() {
  if (typeof window === 'undefined') return {};

  return {
    inbound_referral_code: localStorage.getItem('baise_referral_code') || undefined,
    inbound_referral_landing: localStorage.getItem('baise_referral_landing') || undefined,
    inbound_partner_code: localStorage.getItem('baise_partner_code') || undefined,
    inbound_partner_landing: localStorage.getItem('baise_partner_landing') || undefined,
  };
}

function clearSignupAttribution() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('baise_referral_code');
  localStorage.removeItem('baise_referral_landing');
  localStorage.removeItem('baise_partner_code');
  localStorage.removeItem('baise_partner_landing');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer profile ensure with setTimeout to avoid deadlock
        if (session?.user) {
          const meta = session.user.user_metadata || {};
          setTimeout(() => {
            ensureProfile(session.user.id, {
              email: session.user.email,
              full_name: meta.full_name || meta.name,
              first_name: meta.first_name,
              last_name: meta.last_name,
              avatar_url: meta.avatar_url || meta.picture,
            });
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const meta = session.user.user_metadata || {};
        ensureProfile(session.user.id, {
          email: session.user.email,
          full_name: meta.full_name || meta.name,
          first_name: meta.first_name,
          last_name: meta.last_name,
          avatar_url: meta.avatar_url || meta.picture,
        });
      }
      setLoading(false);
    }).catch(() => {
      // If Supabase is unreachable, still allow the app to render
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const syncReferralIdentity = async (userId: string, email?: string | null) => {
    const appKey = getBaiseAppKey();
    const attribution = getStoredAttribution();

    await db.rpc('ensure_profile_referral_identity', {
      target_user_id: userId,
      target_app_key: appKey,
    }).catch(() => null);

    await db.rpc('activate_partner_applications_for_user', {
      target_user_id: userId,
      target_email: email || null,
    }).catch(() => null);

    if (attribution.inbound_referral_code) {
      await db.rpc('track_referral_event', {
        target_code: attribution.inbound_referral_code,
        target_event_type: 'signup',
        target_app_key: appKey,
        event_metadata: {
          source: 'client_auth_sync',
          landing: attribution.inbound_referral_landing || null,
        },
      }).catch(() => null);
    }

    if (attribution.inbound_partner_code) {
      await db.rpc('track_partner_campaign_click', {
        target_tracking_code: attribution.inbound_partner_code,
        target_event_type: 'lead',
        event_metadata: {
          source: 'client_auth_sync',
          landing: attribution.inbound_partner_landing || null,
          app_key: appKey,
        },
      }).catch(() => null);
    }

    if (attribution.inbound_referral_code || attribution.inbound_partner_code) {
      clearSignupAttribution();
    }

    const { data: refreshedProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (refreshedProfile) setProfile(refreshedProfile as Profile);
  };

  const ensureProfile = async (userId: string, userData?: { email?: string; full_name?: string; avatar_url?: string; first_name?: string; last_name?: string }) => {
    // First try to fetch existing profile
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingProfile) {
      setProfile(existingProfile as Profile);
      void syncReferralIdentity(userId, existingProfile.email);
      return;
    }

    // Profile doesn't exist — create one (handles OAuth users where DB trigger may have failed)
    const firstName = userData?.first_name ||
      (userData?.full_name ? userData.full_name.split(' ')[0] : null);
    const lastName = userData?.last_name ||
      (userData?.full_name ? userData.full_name.split(' ').slice(1).join(' ') : null);

    const handle = `user_${userId.slice(0, 8)}`;
    const referralCode = `REF${userId.slice(0, 6).toUpperCase()}`;
    const signupIntent = resolveSignupIntent(
      typeof window !== 'undefined' ? window.location.search : '',
    );

    const { data: newProfile, error } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        email: userData?.email || null,
        first_name: firstName,
        last_name: lastName,
        avatar_url: userData?.avatar_url || null,
        user_type: signupIntent === 'provider' ? 'provider' : 'customer',
        handle,
        referral_code: referralCode,
        credits_balance: 0,
        status: 'active',
        languages: ['portuguese'],
      })
      .select()
      .single();

    if (!error && newProfile) {
      setProfile(newProfile as Profile);
      await syncReferralIdentity(userId, userData?.email || null);
    } else if (error?.code === '23505') {
      // Duplicate key — profile was created by trigger between our check and insert
      const { data: retryProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (retryProfile) {
        setProfile(retryProfile as Profile);
        await syncReferralIdentity(userId, retryProfile.email);
      }
    }
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string, languages?: string[]) => {
    const search = typeof window !== 'undefined' ? window.location.search : '';
    const redirectUrl = buildAuthCallbackUrl(window.location.origin, search);
    const signupIntent = resolveSignupIntent(search);
    const appKey = getBaiseAppKey();
    const attribution = getStoredAttribution();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
          languages: languages || ['portuguese'],
          app_key: appKey,
          signup_app: appKey,
          signup_url: window.location.origin,
          signup_intent: signupIntent,
          inbound_referral_code: attribution.inbound_referral_code,
          inbound_referral_landing: attribution.inbound_referral_landing,
          inbound_partner_code: attribution.inbound_partner_code,
          inbound_partner_landing: attribution.inbound_partner_landing,
        },
      },
    });

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  // Whitelist: only these fields may be updated from the client.
  // Fields like credits_balance, status, user_type, referral_code, email, id, user_id
  // must NEVER be modifiable from the client side.
  const ALLOWED_PROFILE_FIELDS: (keyof Profile)[] = [
    'first_name', 'last_name', 'phone', 'avatar_url',
    'city', 'state', 'bio', 'languages', 'handle',
  ];

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const sanitizedData: Record<string, unknown> = {};
    for (const key of ALLOWED_PROFILE_FIELDS) {
      if (key in data) {
        sanitizedData[key] = data[key];
      }
    }

    if (Object.keys(sanitizedData).length === 0) {
      return { error: new Error('No valid fields to update') };
    }

    const { error } = await supabase
      .from('profiles')
      .update(sanitizedData)
      .eq('user_id', user.id);

    if (!error) {
      setProfile(prev => prev ? { ...prev, ...sanitizedData } as Profile : null);
    }

    return { error };
  };

  const refreshProfile = async () => {
    if (user) {
      await ensureProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      profile, 
      loading, 
      signUp, 
      signIn, 
      signOut,
      updateProfile,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
