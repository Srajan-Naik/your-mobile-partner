import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/**
 * Hook to subscribe to real-time message updates for a specific conversation
 */
export function useRealtimeMessages(conversationId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log("New message received:", payload);
          // Invalidate messages query to refetch
          queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log("Message updated:", payload);
          queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);
}

/**
 * Hook to subscribe to real-time notification updates for the current user
 */
export function useRealtimeNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("New notification received:", payload);
          const notification = payload.new as {
            title: string;
            body: string;
            type: string;
          };

          // Show toast for new notifications
          if (notification.type === "message") {
            toast.info(notification.title, {
              description: notification.body,
            });
          } else if (notification.type === "match") {
            toast.success(notification.title, {
              description: notification.body,
            });
          } else if (notification.type === "reward") {
            toast.success(notification.title, {
              description: notification.body,
            });
          } else {
            toast(notification.title, {
              description: notification.body,
            });
          }

          // Invalidate notification queries
          queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
          queryClient.invalidateQueries({ queryKey: ["notifications-unread-count", user.id] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
          queryClient.invalidateQueries({ queryKey: ["notifications-unread-count", user.id] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
          queryClient.invalidateQueries({ queryKey: ["notifications-unread-count", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
}

/**
 * Hook to subscribe to real-time conversation updates
 */
export function useRealtimeConversations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`conversations:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        (payload) => {
          console.log("Conversation update:", payload);
          // Check if user is a participant
          const conv = payload.new as { passenger_id?: string; driver_id?: string };
          if (conv.passenger_id === user.id || conv.driver_id === user.id) {
            queryClient.invalidateQueries({ queryKey: ["conversations", user.id] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
}

/**
 * Hook to subscribe to real-time lost item updates (for drivers)
 */
export function useRealtimeLostItems() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("lost-items-feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "lost_items",
        },
        (payload) => {
          console.log("New lost item report:", payload);
          const item = payload.new as { status: string };
          if (item.status === "active") {
            queryClient.invalidateQueries({ queryKey: ["driver-reports"] });
            toast.info("New Lost Item Report", {
              description: "A new item has been reported in your area",
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "lost_items",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["driver-reports"] });
          queryClient.invalidateQueries({ queryKey: ["lost-items"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
