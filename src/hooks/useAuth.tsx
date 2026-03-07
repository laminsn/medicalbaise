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
        
        // Defer profile fetch with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
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
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      setProfile(data as Profile);
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
      await fetchProfile(user.id);
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