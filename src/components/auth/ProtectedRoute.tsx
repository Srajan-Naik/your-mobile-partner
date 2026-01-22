import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: "passenger" | "driver";
}

export function ProtectedRoute({ children, requiredUserType }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check for required user type
  if (requiredUserType && user?.userType !== requiredUserType) {
    const redirectPath = user?.userType === "driver" 
      ? "/driver/dashboard" 
      : "/passenger/dashboard";
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}
