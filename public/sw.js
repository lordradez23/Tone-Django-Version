self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch { data = { title: "New message", body: event.data.text() }; }
  event.waitUntil(
    self.registration.showNotification(data.title || "Tone", {
      body: data.body || "",
      icon: "/favicon.png",
      tag: data.tag || "tone-push",
      renotify: true,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});
