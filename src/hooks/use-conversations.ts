import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Conversation {
  id: string;
  lost_item_id: string;
  passenger_id: string;
  driver_id: string;
  status: "active" | "resolved" | "closed";
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  lost_item?: {
    id: string;
    title: string;
    category: string;
  };
  passenger_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  driver_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  last_message?: Message;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  message_type: "text" | "image" | "location" | "system";
  image_storage_path: string | null;
  location_lat: number | null;
  location_lng: number | null;
  is_read: boolean;
  created_at: string;
}

export function useConversations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          lost_item:lost_items(id, title, category)
        `)
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (error) throw error;

      // Get profiles for each conversation
      const conversationsWithProfiles = await Promise.all(
        (data || []).map(async (conv) => {
          const otherUserId = user.id === conv.passenger_id ? conv.driver_id : conv.passenger_id;
          
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("user_id", otherUserId)
            .single();

          // Get last message
          const { data: lastMessages } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1);

          // Get unread count
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .eq("is_read", false)
            .neq("sender_id", user.id);

          return {
            ...conv,
            other_user_profile: profile,
            last_message: lastMessages?.[0],
            unread_count: count || 0,
          };
        })
      );

      return conversationsWithProfiles;
    },
    enabled: !!user?.id,
  });
}

export function useConversation(conversationId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: async () => {
      if (!conversationId) return null;

      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          lost_item:lost_items(id, title, category, description)
        `)
        .eq("id", conversationId)
        .single();

      if (error) throw error;

      // Get the other user's profile
      const otherUserId = user?.id === data.passenger_id ? data.driver_id : data.passenger_id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, phone")
        .eq("user_id", otherUserId)
        .single();

      return {
        ...data,
        other_user_profile: profile,
      };
    },
    enabled: !!conversationId && !!user?.id,
  });
}

export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!conversationId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
      messageType = "text",
      imageStoragePath,
      locationLat,
      locationLng,
    }: {
      conversationId: string;
      content?: string;
      messageType?: "text" | "image" | "location" | "system";
      imageStoragePath?: string;
      locationLat?: number;
      locationLng?: number;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          message_type: messageType,
          image_storage_path: imageStoragePath,
          location_lat: locationLat,
          location_lng: locationLng,
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation's last_message_at
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error) => {
      toast.error("Failed to send message");
      console.error(error);
    },
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      lostItemId,
      passengerId,
    }: {
      lostItemId: string;
      passengerId: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Check if conversation already exists
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("lost_item_id", lostItemId)
        .eq("driver_id", user.id)
        .single();

      if (existing) {
        return existing;
      }

      const { data, error } = await supabase
        .from("conversations")
        .insert({
          lost_item_id: lostItemId,
          passenger_id: passengerId,
          driver_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Conversation started!");
    },
    onError: (error) => {
      toast.error("Failed to start conversation");
      console.error(error);
    },
  });
}

export function useMarkMessagesRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Use secure SECURITY DEFINER function to ensure only recipients can mark as read
      const { error } = await supabase.rpc("mark_messages_read", {
        _conversation_id: conversationId,
      });

      if (error) throw error;
    },
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
