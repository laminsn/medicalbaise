self.addEventListener('push', (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch (_error) {
    payload = {
      title: 'Baise notification',
      body: event.data ? event.data.text() : 'Open Baise for the latest update.',
    };
  }

  const title = payload.title || 'Baise notification';
  const options = {
    body: payload.body || payload.message || 'Open Baise for the latest update.',
    icon: payload.icon || '/favicon.ico',
    badge: payload.badge || '/favicon.ico',
    data: {
      url: payload.url || payload.actionUrl || '/notifications',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/notifications';

  event.waitUntil((async () => {
    const clientsList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    const origin = self.location.origin;
    const safeUrl = new URL(targetUrl, origin);

    for (const client of clientsList) {
      if ('focus' in client && client.url.startsWith(origin)) {
        await client.focus();
        if ('navigate' in client) {
          await client.navigate(safeUrl.href);
        }
        return;
      }
    }

    if (clients.openWindow) {
      await clients.openWindow(safeUrl.href);
    }
  })());
});
