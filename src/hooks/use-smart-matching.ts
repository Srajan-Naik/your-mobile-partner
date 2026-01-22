import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { LostItem } from "./use-lost-items";

export interface MatchResult {
  item: LostItem;
  confidence_score: number;
  match_reasons: string[];
}

export interface MatchResponse {
  matches: MatchResult[];
  total_items_analyzed: number;
  matches_found: number;
}

export interface MatchRequest {
  found_item_description: string;
  found_location_lat?: number;
  found_location_lng?: number;
  found_date?: string;
  auto_number?: string;
}

/**
 * Hook to find matching lost items using AI-powered matching
 */
export function useSmartMatching() {
  return useMutation({
    mutationFn: async (request: MatchRequest): Promise<MatchResponse> => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        throw new Error("Not authenticated");
      }

      const response = await supabase.functions.invoke("match-items", {
        body: request,
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to find matches");
      }

      return response.data as MatchResponse;
    },
    onSuccess: (data) => {
      if (data.matches_found > 0) {
        toast.success(`Found ${data.matches_found} potential matches!`);
      } else {
        toast.info("No matching lost items found");
      }
    },
    onError: (error: Error) => {
      console.error("Smart matching error:", error);
      toast.error(error.message || "Failed to search for matches");
    },
  });
}

/**
 * Get confidence level label based on score
 */
export function getConfidenceLabel(score: number): {
  label: string;
  color: string;
} {
  if (score >= 80) {
    return { label: "Very High", color: "text-green-600" };
  } else if (score >= 60) {
    return { label: "High", color: "text-emerald-600" };
  } else if (score >= 40) {
    return { label: "Medium", color: "text-yellow-600" };
  } else {
    return { label: "Low", color: "text-orange-600" };
  }
}
