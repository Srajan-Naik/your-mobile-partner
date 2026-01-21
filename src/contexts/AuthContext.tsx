import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";

type UserType = "passenger" | "driver" | null;

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  user_type: "passenger" | "driver";
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  phone: string | null;
  email?: string | null;
  name?: string | null;
  userType: UserType;
  isVerified: boolean;
  avatarUrl?: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (phone: string, password: string, userType: UserType) => Promise<{ error?: string }>;
  signIn: (phone: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  verifyOtp: (phone: string, token: string) => Promise<{ error?: string; success: boolean }>;
  resendOtp: (phone: string) => Promise<{ error?: string }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: string }>;
  pendingPhone: string | null;
  setPendingPhone: (phone: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);

  // Fetch profile from Supabase
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    return data as Profile;
  };

  // Convert Supabase user + profile to our User type
  const mapToUser = (supabaseUser: SupabaseUser, profile: Profile | null): User => ({
    id: supabaseUser.id,
    phone: supabaseUser.phone ?? profile?.phone ?? null,
    email: supabaseUser.email,
    name: profile?.display_name,
    userType: profile?.user_type ?? null,
    isVerified: profile?.is_verified ?? false,
    avatarUrl: profile?.avatar_url,
  });

  // Initialize auth state
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state change:", event);
        setSession(currentSession);

        if (currentSession?.user) {
          // Use setTimeout to avoid Supabase deadlock
          setTimeout(async () => {
            const userProfile = await fetchProfile(currentSession.user.id);
            setProfile(userProfile);
            setUser(mapToUser(currentSession.user, userProfile));
            setIsLoading(false);
          }, 0);
        } else {
          setUser(null);
          setProfile(null);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      if (existingSession?.user) {
        setSession(existingSession);
        const userProfile = await fetchProfile(existingSession.user.id);
        setProfile(userProfile);
        setUser(mapToUser(existingSession.user, userProfile));
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign up with phone and password
  const signUp = async (phone: string, password: string, userType: UserType): Promise<{ error?: string }> => {
    setIsLoading(true);
    
    // Format phone number (ensure it starts with +)
    const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;
    
    try {
      const { data, error } = await supabase.auth.signUp({
        phone: formattedPhone,
        password,
        options: {
          data: {
            user_type: userType,
          },
        },
      });

      if (error) {
        console.error("Signup error:", error);
        return { error: error.message };
      }

      if (data.user) {
        // Store pending phone for OTP verification
        setPendingPhone(formattedPhone);
        
        // Update profile with user type
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ user_type: userType })
          .eq("user_id", data.user.id);

        if (profileError) {
          console.error("Profile update error:", profileError);
        }

        // Add driver role if user is a driver
        if (userType === "driver") {
          const { error: roleError } = await supabase
            .from("user_roles")
            .insert({ user_id: data.user.id, role: "driver" });
          
          if (roleError && !roleError.message.includes("duplicate")) {
            console.error("Role insert error:", roleError);
          }
        }
      }

      return {};
    } catch (err) {
      console.error("Signup exception:", err);
      return { error: "An unexpected error occurred" };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in with phone and password
  const signIn = async (phone: string, password: string): Promise<{ error?: string }> => {
    setIsLoading(true);
    
    const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        phone: formattedPhone,
        password,
      });

      if (error) {
        console.error("SignIn error:", error);
        return { error: error.message };
      }

      return {};
    } catch (err) {
      console.error("SignIn exception:", err);
      return { error: "An unexpected error occurred" };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
      setPendingPhone(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP
  const verifyOtp = async (phone: string, token: string): Promise<{ error?: string; success: boolean }> => {
    setIsLoading(true);
    
    const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;
    
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token,
        type: "sms",
      });

      if (error) {
        console.error("OTP verification error:", error);
        return { error: error.message, success: false };
      }

      if (data.user) {
        // Update profile to verified
        await supabase
          .from("profiles")
          .update({ is_verified: true })
          .eq("user_id", data.user.id);

        setPendingPhone(null);
        return { success: true };
      }

      return { error: "Verification failed", success: false };
    } catch (err) {
      console.error("OTP verification exception:", err);
      return { error: "An unexpected error occurred", success: false };
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const resendOtp = async (phone: string): Promise<{ error?: string }> => {
    const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) {
        console.error("Resend OTP error:", error);
        return { error: error.message };
      }

      return {};
    } catch (err) {
      console.error("Resend OTP exception:", err);
      return { error: "An unexpected error occurred" };
    }
  };

  // Update profile
  const updateProfile = async (updates: Partial<Profile>): Promise<{ error?: string }> => {
    if (!user?.id) {
      return { error: "Not authenticated" };
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user.id);

      if (error) {
        console.error("Profile update error:", error);
        return { error: error.message };
      }

      // Refresh profile
      const updatedProfile = await fetchProfile(user.id);
      if (updatedProfile) {
        setProfile(updatedProfile);
        setUser(mapToUser(session!.user, updatedProfile));
      }

      return {};
    } catch (err) {
      console.error("Profile update exception:", err);
      return { error: "An unexpected error occurred" };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isAuthenticated: !!session,
        signUp,
        signIn,
        signOut,
        verifyOtp,
        resendOtp,
        updateProfile,
        pendingPhone,
        setPendingPhone,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
