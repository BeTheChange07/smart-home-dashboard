// sw.js - Service Worker for Smart Home Push Notifications
// Place this file in your React app's /public directory so it's served
// from the root of your domain (e.g. http://localhost:5173/sw.js)

// Listen for push events from the server
self.addEventListener("push", (event) => {
  let data = { title: "Smart Home", body: "New notification" };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || "/smart-home-icon.png",
    badge: "/smart-home-badge.png",
    tag: (data.tag || "smart-home") + "-" + Date.now(),
    // Show timestamp
    timestamp: Date.now(),
    // Vibrate pattern for mobile: vibrate 200ms, pause 100ms, vibrate 200ms
    vibrate: [200, 100, 200],
    // Keep notification visible until user interacts with it
    requireInteraction: data.data?.priority === "HIGH",
    // Pass through custom data so we can use it on click
    data: data.data || {},
    // Action buttons on the notification
    actions: [
      { action: "open", title: "Open Dashboard" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  // Open or focus the app when clicking the notification
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If there's already an open tab, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});

// Handle notification close (user swiped away)
self.addEventListener("notificationclose", (event) => {
  // You could log analytics here if needed
  console.log("Notification closed:", event.notification.tag);
});
