import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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

  const ensureProfile = async (userId: string, userData?: { email?: string; full_name?: string; avatar_url?: string; first_name?: string; last_name?: string }) => {
    // First try to fetch existing profile
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingProfile) {
      setProfile(existingProfile as Profile);
      return;
    }

    // Profile doesn't exist — create one (handles OAuth users where DB trigger may have failed)
    const firstName = userData?.first_name ||
      (userData?.full_name ? userData.full_name.split(' ')[0] : null);
    const lastName = userData?.last_name ||
      (userData?.full_name ? userData.full_name.split(' ').slice(1).join(' ') : null);

    const handle = `user_${userId.slice(0, 8)}`;
    const referralCode = `REF${userId.slice(0, 6).toUpperCase()}`;

    const { data: newProfile, error } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        email: userData?.email || null,
        first_name: firstName,
        last_name: lastName,
        avatar_url: userData?.avatar_url || null,
        user_type: 'customer',
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
    } else if (error?.code === '23505') {
      // Duplicate key — profile was created by trigger between our check and insert
      const { data: retryProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (retryProfile) setProfile(retryProfile as Profile);
    }
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string, languages?: string[]) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
          languages: languages || ['portuguese'],
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