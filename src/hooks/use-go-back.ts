import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Smart back navigation hook that falls back to the appropriate dashboard
 * when there's no browser history (e.g., after direct navigation or login)
 */
export function useGoBack(fallbackPath?: string) {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const goBack = () => {
    // Check if there's history to go back to
    // window.history.length > 2 because:
    // - 1 = initial blank page
    // - 2 = current page (no previous page to go back to)
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      // Fallback to provided path or appropriate dashboard
      const defaultFallback = profile?.user_type === "driver" 
        ? "/driver/dashboard" 
        : "/passenger/dashboard";
      navigate(fallbackPath || defaultFallback, { replace: true });
    }
  };

  return goBack;
}
