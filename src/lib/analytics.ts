import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

// Analytics event types
export type EventType = "page_view" | "user_action" | "feature_usage" | "error" | "performance";

interface TrackEventParams {
  eventType: EventType;
  eventName: string;
  properties?: Record<string, Json>;
}

interface TrackErrorParams {
  errorMessage: string;
  errorStack?: string;
  componentStack?: string;
  metadata?: Record<string, Json>;
}

interface TrackPerformanceParams {
  loadTimeMs?: number;
  timeToFirstByteMs?: number;
  domContentLoadedMs?: number;
  firstContentfulPaintMs?: number;
  largestContentfulPaintMs?: number;
}

// Get current user ID safely
const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id || null;
  } catch {
    return null;
  }
};

// Get connection type for performance tracking
const getConnectionType = (): string | null => {
  // @ts-expect-error - Navigator connection API
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return connection?.effectiveType || null;
};

// Track a custom event
export const trackEvent = async ({ eventType, eventName, properties = {} }: TrackEventParams): Promise<void> => {
  try {
    const userId = await getCurrentUserId();
    
    await supabase.from("analytics_events").insert([{
      user_id: userId,
      event_type: eventType,
      event_name: eventName,
      page_path: window.location.pathname,
      properties,
      user_agent: navigator.userAgent,
      screen_width: window.innerWidth,
      screen_height: window.innerHeight,
    }]);
  } catch (error) {
    console.warn("Failed to track event:", error);
  }
};

// Track page view
export const trackPageView = async (pagePath?: string): Promise<void> => {
  await trackEvent({
    eventType: "page_view",
    eventName: "page_view",
    properties: {
      path: pagePath || window.location.pathname,
      referrer: document.referrer,
      title: document.title,
    },
  });
};

// Track user action (clicks, form submissions, etc.)
export const trackUserAction = async (
  actionName: string,
  properties: Record<string, Json> = {}
): Promise<void> => {
  await trackEvent({
    eventType: "user_action",
    eventName: actionName,
    properties,
  });
};

// Track feature usage
export const trackFeatureUsage = async (
  featureName: string,
  properties: Record<string, Json> = {}
): Promise<void> => {
  await trackEvent({
    eventType: "feature_usage",
    eventName: featureName,
    properties,
  });
};

// Track errors
export const trackError = async ({
  errorMessage,
  errorStack,
  componentStack,
  metadata = {},
}: TrackErrorParams): Promise<void> => {
  try {
    const userId = await getCurrentUserId();
    
    await supabase.from("error_logs").insert([{
      user_id: userId,
      error_message: errorMessage,
      error_stack: errorStack,
      component_stack: componentStack,
      page_path: window.location.pathname,
      user_agent: navigator.userAgent,
      metadata,
    }]);
  } catch (error) {
    console.warn("Failed to track error:", error);
  }
};

// Track performance metrics
export const trackPerformance = async ({
  loadTimeMs,
  timeToFirstByteMs,
  domContentLoadedMs,
  firstContentfulPaintMs,
  largestContentfulPaintMs,
}: TrackPerformanceParams): Promise<void> => {
  try {
    const userId = await getCurrentUserId();
    
    await supabase.from("performance_metrics").insert([{
      user_id: userId,
      page_path: window.location.pathname,
      load_time_ms: loadTimeMs,
      time_to_first_byte_ms: timeToFirstByteMs,
      dom_content_loaded_ms: domContentLoadedMs,
      first_contentful_paint_ms: firstContentfulPaintMs,
      largest_contentful_paint_ms: largestContentfulPaintMs,
      user_agent: navigator.userAgent,
      connection_type: getConnectionType(),
    }]);
  } catch (error) {
    console.warn("Failed to track performance:", error);
  }
};

// Collect and send Web Vitals automatically
export const collectWebVitals = (): void => {
  if (typeof window === "undefined") return;

  // Wait for page to fully load
  window.addEventListener("load", () => {
    setTimeout(() => {
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType("paint");
      
      const fcp = paintEntries.find((entry) => entry.name === "first-contentful-paint");
      
      // Get LCP using PerformanceObserver if available
      let lcp: number | undefined;
      
      if ("PerformanceObserver" in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as PerformancePaintTiming;
            lcp = lastEntry?.startTime;
          });
          observer.observe({ type: "largest-contentful-paint", buffered: true });
          
          // Disconnect after a short delay
          setTimeout(() => observer.disconnect(), 3000);
        } catch {
          // LCP not supported
        }
      }
      
      // Send metrics after a short delay to capture LCP
      setTimeout(() => {
        trackPerformance({
          loadTimeMs: navigation ? Math.round(navigation.loadEventEnd - navigation.fetchStart) : undefined,
          timeToFirstByteMs: navigation ? Math.round(navigation.responseStart - navigation.requestStart) : undefined,
          domContentLoadedMs: navigation ? Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart) : undefined,
          firstContentfulPaintMs: fcp ? Math.round(fcp.startTime) : undefined,
          largestContentfulPaintMs: lcp ? Math.round(lcp) : undefined,
        });
      }, 3500);
    }, 100);
  });
};

// Global error handler
export const setupGlobalErrorHandler = (): void => {
  window.addEventListener("error", (event) => {
    trackError({
      errorMessage: event.message,
      errorStack: event.error?.stack,
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    trackError({
      errorMessage: `Unhandled Promise Rejection: ${event.reason}`,
      errorStack: event.reason?.stack,
      metadata: {
        type: "unhandledrejection",
      },
    });
  });
};
