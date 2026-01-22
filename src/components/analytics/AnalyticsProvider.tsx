import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  trackPageView,
  collectWebVitals,
  setupGlobalErrorHandler,
} from "@/lib/analytics";

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const location = useLocation();

  // Setup global error handler and collect web vitals on mount
  useEffect(() => {
    setupGlobalErrorHandler();
    collectWebVitals();
  }, []);

  // Track page views on route change
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  return <>{children}</>;
}
