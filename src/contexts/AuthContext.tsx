import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";

type UserType = "passenger" | "driver" | null;

const SUPABASE_URL = "https://jbynphyslmnxlwwbsxkh.supabase.co";

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

interface OtpData {
  otpHash: string;
  expiresAt: string;
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
  sendOtp: (phone: string, type: "signup" | "login" | "resend") => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);
  const [otpData, setOtpData] = useState<OtpData | null>(null);

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

  // Send OTP via Twilio edge function (internal helper)
  const sendOtpToPhone = async (phone: string, type: "signup" | "login" | "resend"): Promise<{ error?: string }> => {
    const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone: formattedPhone, type }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Send OTP error:", data);
        return { error: data.error || "Failed to send verification code" };
      }

      // Store OTP hash for verification
      setOtpData({
        otpHash: data.otpHash,
        expiresAt: data.expiresAt,
      });

      return {};
    } catch (err) {
      console.error("Send OTP exception:", err);
      return { error: "Failed to send verification code" };
    }
  };

  // Convert phone to email for Supabase auth (workaround for disabled phone provider)
  const phoneToEmail = (phone: string): string => {
    // Remove all non-digit characters and create a deterministic email.
    // NOTE: GoTrue validates email format strictly; use a real-looking domain.
    const digits = phone.replace(/\D/g, "");
    return `${digits}@phone.autoconnect.app`;
  };

  // Sign up with phone and password
  const signUp = async (phone: string, password: string, userType: UserType): Promise<{ error?: string }> => {
    setIsLoading(true);
    
    // Format phone number (ensure it starts with +)
    const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;
    const email = phoneToEmail(formattedPhone);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: userType,
            phone: formattedPhone,
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        console.error("Signup error:", error);
        // Translate common errors to user-friendly messages
        if (error.message.includes("already registered")) {
          return { error: "This phone number is already registered. Please login instead." };
        }
        return { error: error.message };
      }

      if (data.user) {
        // Store pending phone for OTP verification
        setPendingPhone(formattedPhone);
        
        // Update profile with user type and phone
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ user_type: userType, phone: formattedPhone })
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

        // Send OTP via Twilio
        const otpResult = await sendOtpToPhone(formattedPhone, "signup");
        if (otpResult.error) {
          console.error("Failed to send OTP:", otpResult.error);
          // Don't fail signup, just log the error
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
    const email = phoneToEmail(formattedPhone);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("SignIn error:", error);
        // Translate common errors to user-friendly messages
        if (error.message.includes("Invalid login credentials")) {
          return { error: "Invalid phone number or password" };
        }
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

  // Verify OTP via Twilio edge function
  const verifyOtp = async (phone: string, token: string): Promise<{ error?: string; success: boolean }> => {
    setIsLoading(true);
    
    const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;
    
    try {
      if (!otpData?.otpHash) {
        return { error: "No pending verification. Please request a new code.", success: false };
      }

      // Check if OTP expired
      if (new Date(otpData.expiresAt) < new Date()) {
        setOtpData(null);
        return { error: "Verification code expired. Please request a new one.", success: false };
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          phone: formattedPhone, 
          otp: token, 
          otpHash: otpData.otpHash 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("OTP verification error:", data);
        return { error: data.error || "Invalid verification code", success: false };
      }

      // Clear OTP data and pending phone
      setOtpData(null);
      setPendingPhone(null);

      // Refresh profile to get updated verification status
      if (user?.id) {
        const updatedProfile = await fetchProfile(user.id);
        if (updatedProfile) {
          setProfile(updatedProfile);
          setUser(prev => prev ? { ...prev, isVerified: true } : null);
        }
      }

      return { success: true };
    } catch (err) {
      console.error("OTP verification exception:", err);
      return { error: "An unexpected error occurred", success: false };
    } finally {
      setIsLoading(false);
    }
  };

  // Public sendOtp function (delegates to helper)
  const sendOtp = async (phone: string, type: "signup" | "login" | "resend"): Promise<{ error?: string }> => {
    return sendOtpToPhone(phone, type);
  };

  // Resend OTP via Twilio
  const resendOtp = async (phone: string): Promise<{ error?: string }> => {
    return sendOtpToPhone(phone, "resend");
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
        sendOtp,
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
