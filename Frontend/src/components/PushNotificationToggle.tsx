import { usePushNotifications } from "../hooks/usePushNotifications";

/**
 * PushNotificationToggle
 *
 * Drop this component anywhere in your smart home UI.
 * It shows a button to enable/disable browser push notifications
 * and displays the current subscription status.
 */
export function PushNotificationToggle() {
  const { permission, isSubscribed, isLoading, subscribe, unsubscribe, error } =
    usePushNotifications();

  if (permission === "unsupported") {
    return (
      <div className="text-sm text-gray-400 italic">
        Push notifications are not supported in this browser.
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="text-sm text-red-400">
        Push notifications are blocked. Enable them in your browser settings to
        receive alerts on this device.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={isSubscribed ? unsubscribe : subscribe}
        disabled={isLoading}
        className={`
          px-4 py-2 rounded-lg text-sm font-medium transition-colors
          ${isSubscribed
            ? "bg-red-600/20 text-red-300 hover:bg-red-600/30"
            : "bg-green-600/20 text-green-300 hover:bg-green-600/30"
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {isLoading
          ? "..."
          : isSubscribed
            ? "Disable Push Notifications"
            : "Enable Push Notifications"}
      </button>

      {isSubscribed && (
        <span className="text-xs text-green-400">
          Receiving alerts on this device
        </span>
      )}

      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
