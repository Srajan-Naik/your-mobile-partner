import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type UserType = "passenger" | "driver" | null;

interface User {
  id: string;
  phone: string;
  email?: string;
  name?: string;
  userType: UserType;
  isVerified: boolean;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<void>;
  signup: (phone: string, password: string, userType: UserType) => Promise<void>;
  logout: () => Promise<void>;
  verifyPhone: (otp: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkAuth = async () => {
      try {
        // TODO: Implement Supabase auth check
        const storedUser = localStorage.getItem("autoconnect_user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (phone: string, password: string) => {
    setIsLoading(true);
    try {
      // TODO: Implement Supabase auth login
      // For now, mock login
      const mockUser: User = {
        id: "mock-id",
        phone,
        userType: "passenger",
        isVerified: true,
      };
      setUser(mockUser);
      localStorage.setItem("autoconnect_user", JSON.stringify(mockUser));
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (phone: string, password: string, userType: UserType) => {
    setIsLoading(true);
    try {
      // TODO: Implement Supabase auth signup
      // For now, mock signup
      const mockUser: User = {
        id: "mock-id",
        phone,
        userType,
        isVerified: false,
      };
      setUser(mockUser);
      localStorage.setItem("autoconnect_user", JSON.stringify(mockUser));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement Supabase auth logout
      setUser(null);
      localStorage.removeItem("autoconnect_user");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPhone = async (otp: string): Promise<boolean> => {
    // TODO: Implement phone verification
    if (otp.length === 6) {
      if (user) {
        const verifiedUser = { ...user, isVerified: true };
        setUser(verifiedUser);
        localStorage.setItem("autoconnect_user", JSON.stringify(verifiedUser));
      }
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        verifyPhone,
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
