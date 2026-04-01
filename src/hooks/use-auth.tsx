"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Profile } from "@/types";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
        
      if (error) console.error("Profile fetch error:", error);
      if (data) {
        setProfile(data as Profile);
      }
    } catch (err) {
      console.error("Unexpected error fetching profile:", err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    const getUser = async () => {
      try {
        // Use getSession for immediate local cache hit instead of network-bound getUser
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        // Turn off loading auth state instantly so UI buttons show up
        setLoading(false);

        if (session?.user) {
          // Fetch profile in the background without blocking the auth UI
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.error("Auth init error:", err);
        setLoading(false);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);

        if (session?.user) {
          fetchProfile(session.user.id).catch(console.error);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Auto-refresh profile on window focus to keep multiple devices in sync
  useEffect(() => {
    if (!user) return;
    const onFocus = () => {
      if (document.visibilityState === "visible") {
         refreshProfile().catch(console.error);
      }
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("visibilitychange", onFocus);
    };
  }, [user]);

  const signOut = async () => {
    // Instant UI reaction for perceived performance
    setUser(null);
    setProfile(null);
    
    try {
      // Fire and forget network call. Supabase clears local storage synchronously.
      supabase.auth.signOut().catch(console.error);
    } catch (error) {
      console.error("Sign out error:", error);
    } 
    
    // Navigate instantly
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
