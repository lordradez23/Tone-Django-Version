import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { api, API_BASE } from "@/integrations/api/client";

interface AuthUser {
  id: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string | null;
  status?: string;
  created_at?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  supabaseUser: User | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, first_name?: string, last_name?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: { username?: string; email?: string; password?: string; first_name?: string; last_name?: string }) => Promise<{ error: Error | null }>;
  updateAvatar: (file: File) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync Supabase session → Django profile
  const syncProfile = async (sbUser: User | null) => {
    if (!sbUser) { setUser(null); setSupabaseUser(null); return; }
    setSupabaseUser(sbUser);
    // Build a minimal profile from Supabase metadata while Django syncs
    setUser({
      id: sbUser.id,
      email: sbUser.email ?? "",
      username: sbUser.user_metadata?.username ?? sbUser.email?.split("@")[0] ?? "",
      first_name: sbUser.user_metadata?.first_name ?? "",
      last_name: sbUser.user_metadata?.last_name ?? "",
      avatar_url: sbUser.user_metadata?.avatar_url ?? null,
      created_at: sbUser.created_at,
    });
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      syncProfile(session?.user ?? null).finally(() => setLoading(false));
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncProfile(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string, first_name = "", last_name = "") => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, first_name, last_name },
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });
      if (error) throw error;
      return { error: null };
    } catch (e) { return { error: e as Error }; }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { error: null };
    } catch (e) { return { error: e as Error }; }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
  };

  const updateProfile = async (data: { username?: string; email?: string; password?: string; first_name?: string; last_name?: string }) => {
    try {
      const updates: Record<string, unknown> = {};
      if (data.email) updates.email = data.email;
      if (data.password) updates.password = data.password;
      if (data.username || data.first_name || data.last_name) {
        updates.data = {
          ...(data.username && { username: data.username }),
          ...(data.first_name && { first_name: data.first_name }),
          ...(data.last_name && { last_name: data.last_name }),
        };
      }
      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;
      setUser(prev => prev ? { ...prev, ...data } : prev);
      return { error: null };
    } catch (e) { return { error: e as Error }; }
  };

  const updateAvatar = async (file: File) => {
    try {
      if (!supabaseUser) throw new Error("Not authenticated");
      const ext = file.name.split(".").pop();
      const path = `avatars/${supabaseUser.id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.auth.updateUser({ data: { avatar_url: data.publicUrl } });
      setUser(prev => prev ? { ...prev, avatar_url: data.publicUrl } : prev);
      return { error: null };
    } catch (e) { return { error: e as Error }; }
  };

  return (
    <AuthContext.Provider value={{ user, supabaseUser, loading, signUp, signIn, signOut, updateProfile, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
