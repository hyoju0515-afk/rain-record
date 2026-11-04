self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch {}
  event.waitUntil(self.registration.showNotification(data.title || '비 알림', {
    body: data.body || '외출 전 비 예보를 확인하세요.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: '/' }
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.matchAll({type:'window', includeUncontrolled:true}).then(list => {
    for (const client of list) if ('focus' in client) return client.focus();
    return clients.openWindow('/');
  }));
});
