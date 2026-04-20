// Minimal service worker for Wansom chat-completion notifications.
// No caching — only registered to unlock ServiceWorkerRegistration.showNotification(),
// which is required on Android Chrome (new Notification() is unsupported there).
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (clientList) {
        for (var i = 0; i < clientList.length; i++) {
          if ('focus' in clientList[i]) return clientList[i].focus();
        }
        if (clients.openWindow) return clients.openWindow('/');
      })
  );
});
