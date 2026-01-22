import { useCallback } from "react";
import type { Json } from "@/integrations/supabase/types";
import {
  trackUserAction,
  trackFeatureUsage,
  trackError,
} from "@/lib/analytics";

export function useAnalytics() {
  const trackAction = useCallback(
    (actionName: string, properties?: Record<string, Json>) => {
      trackUserAction(actionName, properties);
    },
    []
  );

  const trackFeature = useCallback(
    (featureName: string, properties?: Record<string, Json>) => {
      trackFeatureUsage(featureName, properties);
    },
    []
  );

  const logError = useCallback(
    (
      error: Error | string,
      metadata?: Record<string, Json>
    ) => {
      const errorMessage = typeof error === "string" ? error : error.message;
      const errorStack = typeof error === "string" ? undefined : error.stack;
      trackError({ errorMessage, errorStack, metadata });
    },
    []
  );

  return {
    trackAction,
    trackFeature,
    logError,
  };
}
