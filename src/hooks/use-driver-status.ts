import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useEffect, useRef } from "react";

/**
 * Hook to get the current driver's online status
 */
export function useDriverStatus() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["driver-status", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("is_online, last_seen_at")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && user.userType === "driver",
  });
}

/**
 * Hook to toggle driver online/offline status
 */
export function useToggleDriverStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (isOnline: boolean) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({
          is_online: isOnline,
          last_seen_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;
      return isOnline;
    },
    onSuccess: (isOnline) => {
      queryClient.invalidateQueries({ queryKey: ["driver-status", user?.id] });
      toast.success(isOnline ? "You are now online" : "You are now offline");
    },
    onError: (error) => {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
    },
  });
}

/**
 * Hook to automatically update last_seen_at while driver is online
 * Updates every 60 seconds to show activity
 */
export function useDriverPresence() {
  const { user } = useAuth();
  const { data: status } = useDriverStatus();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user?.id || user.userType !== "driver" || !status?.is_online) {
      // Clear interval if driver goes offline or user changes
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Update last_seen_at every 60 seconds while online
    const updatePresence = async () => {
      try {
        await supabase
          .from("profiles")
          .update({ last_seen_at: new Date().toISOString() })
          .eq("user_id", user.id);
      } catch (error) {
        console.error("Failed to update presence:", error);
      }
    };

    // Initial update
    updatePresence();

    // Set interval for updates
    intervalRef.current = setInterval(updatePresence, 60000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user?.id, user?.userType, status?.is_online]);

  // Set offline when leaving the page
  useEffect(() => {
    if (!user?.id || user.userType !== "driver") return;

    const handleBeforeUnload = async () => {
      // Use sendBeacon for reliable offline update
      const payload = JSON.stringify({
        is_online: false,
        last_seen_at: new Date().toISOString(),
      });
      
      navigator.sendBeacon(
        `https://jbynphyslmnxlwwbsxkh.supabase.co/rest/v1/profiles?user_id=eq.${user.id}`,
        new Blob([payload], { type: "application/json" })
      );
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [user?.id, user?.userType]);
}

/**
 * Hook to get count of online drivers
 */
export function useOnlineDriverCount() {
  return useQuery({
    queryKey: ["online-driver-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_online", true)
        .eq("user_type", "driver");

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
