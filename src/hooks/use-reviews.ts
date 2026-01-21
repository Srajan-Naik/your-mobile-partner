import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Review {
  id: string;
  conversation_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export function useUserReviews(userId: string | undefined) {
  return useQuery({
    queryKey: ["reviews", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("reviewee_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Review[];
    },
    enabled: !!userId,
  });
}

export function useUserAverageRating(userId: string | undefined) {
  return useQuery({
    queryKey: ["average-rating", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from("reviews")
        .select("rating")
        .eq("reviewee_id", userId);

      if (error) throw error;
      
      if (!data || data.length === 0) return null;
      
      const sum = data.reduce((acc, r) => acc + r.rating, 0);
      return {
        average: sum / data.length,
        count: data.length,
      };
    },
    enabled: !!userId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      conversationId,
      revieweeId,
      rating,
      comment,
    }: {
      conversationId: string;
      revieweeId: string;
      rating: number;
      comment?: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("reviews")
        .insert({
          conversation_id: conversationId,
          reviewer_id: user.id,
          reviewee_id: revieweeId,
          rating,
          comment,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["average-rating"] });
      toast.success("Review submitted!");
    },
    onError: (error: Error) => {
      if (error.message.includes("duplicate")) {
        toast.error("You have already reviewed this interaction");
      } else {
        toast.error("Failed to submit review");
      }
      console.error(error);
    },
  });
}
