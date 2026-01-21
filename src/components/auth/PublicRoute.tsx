import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect authenticated users to their dashboard or verification
  if (isAuthenticated && user) {
    // If not verified, redirect to verification
    if (!user.isVerified) {
      return <Navigate to="/verify-phone" replace />;
    }

    const from = location.state?.from?.pathname;
    const redirectPath = from || (user.userType === "driver" 
      ? "/driver/dashboard" 
      : "/passenger/dashboard");
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}
