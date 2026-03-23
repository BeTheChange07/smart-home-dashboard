import { useState, useEffect, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Convert a base64url VAPID public key to the Uint8Array format
// that the Push API's subscribe() method expects.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export type PushPermissionState = "default" | "granted" | "denied" | "unsupported";

export interface UsePushNotificationsReturn {
  /** Current permission state */
  permission: PushPermissionState;
  /** Whether the user is currently subscribed */
  isSubscribed: boolean;
  /** Whether an operation is in progress */
  isLoading: boolean;
  /** Subscribe to push notifications (triggers browser permission prompt) */
  subscribe: () => Promise<void>;
  /** Unsubscribe from push notifications */
  unsubscribe: () => Promise<void>;
  /** Any error message from the last operation */
  error: string | null;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [permission, setPermission] = useState<PushPermissionState>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if push is supported and get current state on mount
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPermission("unsupported");
      setIsLoading(false);
      return;
    }

    setPermission(Notification.permission as PushPermissionState);

    // Register service worker early so .ready resolves
    navigator.serviceWorker.register("/sw.js").then(() => {
      return navigator.serviceWorker.ready;
    }).then((registration) => {
      return registration.pushManager.getSubscription();
    }).then((subscription) => {
      setIsSubscribed(subscription !== null);
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });
  }, []);

  const subscribe = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      // 1. Register the service worker if not already registered
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;

      // 2. Get the VAPID public key from the backend
      const keyResponse = await fetch(`${API_URL}/push/subscribe`);
      const keyData = await keyResponse.json();

      if (keyData.error) {
        throw new Error(keyData.error);
      }

      const vapidPublicKey = urlBase64ToUint8Array(keyData.publicKey);

      // 3. Subscribe to push (this triggers the browser permission prompt)
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      });

      // 4. Send the subscription to our backend to store it
      const response = await fetch(`${API_URL}/push/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!response.ok) {
        throw new Error("Failed to register subscription with server");
      }

      setIsSubscribed(true);
      setPermission("granted");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to subscribe";
      setError(message);

      // Update permission state in case user denied
      if ("Notification" in window) {
        setPermission(Notification.permission as PushPermissionState);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Tell the backend to remove this subscription
        await fetch(`${API_URL}/push/subscribe`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        // Unsubscribe from the browser side
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to unsubscribe";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    error,
  };
}
