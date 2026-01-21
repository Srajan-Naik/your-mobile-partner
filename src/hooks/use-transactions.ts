import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Transaction {
  id: string;
  conversation_id: string | null;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  type: "tip" | "reward" | "withdrawal";
  status: "pending" | "completed" | "failed" | "cancelled";
  notes: string | null;
  created_at: string;
}

export function useTransactions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user?.id,
  });
}

export function useUserBalance() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["balance", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("to_user_id", user.id)
        .eq("status", "completed");

      if (error) throw error;

      const { data: sent } = await supabase
        .from("transactions")
        .select("*")
        .eq("from_user_id", user.id)
        .eq("status", "completed");

      const received = (data || []).reduce((acc, t) => acc + Number(t.amount), 0);
      const sentAmount = (sent || []).reduce((acc, t) => acc + Number(t.amount), 0);

      return received - sentAmount;
    },
    enabled: !!user?.id,
  });
}

export function useSendTip() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      toUserId,
      amount,
      conversationId,
      notes,
    }: {
      toUserId: string;
      amount: number;
      conversationId?: string;
      notes?: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("transactions")
        .insert({
          from_user_id: user.id,
          to_user_id: toUserId,
          amount,
          type: "tip",
          status: "completed", // In real app, this would go through payment processing
          conversation_id: conversationId,
          notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
      toast.success("Tip sent successfully!");
    },
    onError: (error) => {
      toast.error("Failed to send tip");
      console.error(error);
    },
  });
}
