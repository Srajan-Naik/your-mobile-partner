import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// VAPID public key - this is safe to expose in client code
const VAPID_PUBLIC_KEY = "YOUR_VAPID_PUBLIC_KEY_PLACEHOLDER";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Check if push notifications are supported
  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Register service worker
  useEffect(() => {
    if (!isSupported) return;

    navigator.serviceWorker
      .register("/sw-push.js")
      .then((reg) => {
        console.log("Push SW registered:", reg);
        setRegistration(reg);
      })
      .catch((err) => {
        console.error("Push SW registration failed:", err);
      });
  }, [isSupported]);

  // Query current subscription status
  const { data: isSubscribed, refetch: refetchSubscription } = useQuery({
    queryKey: ["push-subscription", user?.id],
    queryFn: async () => {
      if (!user?.id || !registration) return false;

      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return false;

      // Check if subscription exists in database
      const { data, error } = await supabase
        .from("push_subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .eq("endpoint", subscription.endpoint)
        .maybeSingle();

      return !error && !!data;
    },
    enabled: !!user?.id && !!registration,
  });

  // Subscribe to push notifications
  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!registration || !user?.id) {
        throw new Error("Service worker not registered or user not authenticated");
      }

      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      
      if (perm !== "granted") {
        throw new Error("Notification permission denied");
      }

      // Get VAPID public key from edge function
      const { data: configData, error: configError } = await supabase.functions.invoke("push-config");
      if (configError) throw configError;
      
      const vapidPublicKey = configData.vapidPublicKey;
      if (!vapidPublicKey) throw new Error("VAPID public key not configured");

      // Subscribe to push
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      const subscriptionJSON = subscription.toJSON();
      
      // Save to database
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh: subscriptionJSON.keys?.p256dh || "",
          auth: subscriptionJSON.keys?.auth || "",
        },
        { onConflict: "user_id,endpoint" }
      );

      if (error) throw error;
      return subscription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-subscription"] });
      toast.success("Push notifications enabled!");
    },
    onError: (error: Error) => {
      console.error("Subscribe error:", error);
      toast.error(error.message || "Failed to enable notifications");
    },
  });

  // Unsubscribe from push notifications
  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      if (!registration || !user?.id) {
        throw new Error("Service worker not registered or user not authenticated");
      }

      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        // Remove from database
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", user.id)
          .eq("endpoint", subscription.endpoint);

        // Unsubscribe from push manager
        await subscription.unsubscribe();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-subscription"] });
      toast.success("Push notifications disabled");
    },
    onError: (error: Error) => {
      console.error("Unsubscribe error:", error);
      toast.error("Failed to disable notifications");
    },
  });

  const subscribe = useCallback(() => {
    subscribeMutation.mutate();
  }, [subscribeMutation]);

  const unsubscribe = useCallback(() => {
    unsubscribeMutation.mutate();
  }, [unsubscribeMutation]);

  const toggle = useCallback(() => {
    if (isSubscribed) {
      unsubscribe();
    } else {
      subscribe();
    }
  }, [isSubscribed, subscribe, unsubscribe]);

  return {
    isSupported,
    isSubscribed: !!isSubscribed,
    isLoading: subscribeMutation.isPending || unsubscribeMutation.isPending,
    permission,
    subscribe,
    unsubscribe,
    toggle,
    refetch: refetchSubscription,
  };
}
