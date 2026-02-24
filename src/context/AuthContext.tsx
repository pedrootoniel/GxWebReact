import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { authApi, type MuCharacter } from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || '';
const useMuBackend = !!API_URL;

export interface Profile {
  id: string;
  username: string;
  email: string;
  server: string;
  vip_type: string;
  vip_expires: string | null;
  credits: number;
  wcoins: number;
  goblin_points: number;
  is_admin: boolean;
  created_at: string;
  last_login: string;
  isOnline?: boolean;
  characters?: MuCharacter[];
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  muMode: boolean;
  signIn: (usernameOrEmail: string, password: string) => Promise<{ error: string | null }>;
  signUp: (usernameOrEmail: string, password: string, username: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSupabaseProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setProfile(data);
  }, []);

  const fetchMuProfile = useCallback(async () => {
    try {
      const data = await authApi.me();
      setProfile({
        id: data.username,
        username: data.username,
        email: data.email,
        server: data.serverName || 'x9999',
        vip_type: 'none',
        vip_expires: null,
        credits: 0,
        wcoins: 0,
        goblin_points: 0,
        is_admin: data.role === 'admin',
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        isOnline: data.isOnline,
        characters: data.characters,
      });
    } catch {
      localStorage.removeItem('mu_token');
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (useMuBackend) {
      const token = localStorage.getItem('mu_token');
      if (token) await fetchMuProfile();
    } else if (user) {
      await fetchSupabaseProfile(user.id);
    }
  }, [user, fetchSupabaseProfile, fetchMuProfile]);

  useEffect(() => {
    if (useMuBackend) {
      const token = localStorage.getItem('mu_token');
      if (token) {
        fetchMuProfile().finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    } else {
      supabase.auth.getSession().then(({ data: { session: s } }) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          fetchSupabaseProfile(s.user.id);
        }
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          (async () => {
            await fetchSupabaseProfile(s.user.id);
          })();
        } else {
          setProfile(null);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [fetchMuProfile, fetchSupabaseProfile]);

  const signIn = async (usernameOrEmail: string, password: string) => {
    if (useMuBackend) {
      try {
        const result = await authApi.login(usernameOrEmail, password);
        localStorage.setItem('mu_token', result.token);
        await fetchMuProfile();
        return { error: null };
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Login failed' };
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: usernameOrEmail,
        password,
      });
      if (error) return { error: error.message };
      return { error: null };
    }
  };

  const signUp = async (usernameOrEmail: string, password: string, username: string) => {
    if (useMuBackend) {
      try {
        const result = await authApi.register(username, password, usernameOrEmail);
        localStorage.setItem('mu_token', result.token);
        await fetchMuProfile();
        return { error: null };
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Registration failed' };
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: usernameOrEmail,
        password,
      });
      if (error) return { error: error.message };
      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          username,
          email: usernameOrEmail,
        });
        if (profileError) return { error: profileError.message };
      }
      return { error: null };
    }
  };

  const signOut = async () => {
    if (useMuBackend) {
      localStorage.removeItem('mu_token');
      setProfile(null);
    } else {
      await supabase.auth.signOut();
      setProfile(null);
    }
  };

  const isLoggedIn = useMuBackend ? !!profile : !!user;

  return (
    <AuthContext.Provider
      value={{
        user: useMuBackend ? (isLoggedIn ? ({ id: profile?.id } as User) : null) : user,
        session,
        profile,
        loading,
        muMode: useMuBackend,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
