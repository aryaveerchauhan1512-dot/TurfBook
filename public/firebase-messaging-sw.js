// TurfBook Firebase Cloud Messaging Service Worker
// Compatible with Firebase v9 / v10 / v11 Web Push Notifications

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Helper to parse query parameters from the service worker script URL if provided
const swUrl = new URL(location.href);
const apiKey = swUrl.searchParams.get('apiKey');
const projectId = swUrl.searchParams.get('projectId');
const messagingSenderId = swUrl.searchParams.get('messagingSenderId');
const appId = swUrl.searchParams.get('appId');

// Initialize Firebase in Service Worker
// If parameters are not in the URL, initialize with defaults or wait for message config
const firebaseConfig = {
  apiKey: apiKey || 'AIzaSyDZjW74kKPZO-qesqpY158JBBBaMalb808',
  authDomain: 'turfbook-7b4ec.firebaseapp.com',
  projectId: projectId || 'turfbook-7b4ec',
  storageBucket: 'turfbook-7b4ec.firebasestorage.app',
  messagingSenderId: messagingSenderId || '190824969167',
  appId: appId || '1:190824969167:web:7ec6d681aa3a7e9d8c18ba',
};

try {
  if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
  }
} catch (e) {
  console.warn('[FCM SW] Firebase init note:', e);
}

let messaging = null;
try {
  if (firebase.messaging.isSupported()) {
    messaging = firebase.messaging();
  }
} catch (e) {
  console.warn('[FCM SW] Messaging support error:', e);
}

// Background message handler from Firebase SDK
if (messaging) {
  messaging.onBackgroundMessage(function (payload) {
    console.log('[FCM SW] Received background message:', payload);

    const notificationTitle =
      payload.notification?.title || payload.data?.title || 'New TurfBook Booking Request';
    const notificationOptions = {
      body:
        payload.notification?.body ||
        payload.data?.body ||
        'You have a new booking request waiting for approval.',
      icon: payload.notification?.icon || payload.data?.icon || '/favicon.png',
      badge: payload.notification?.badge || payload.data?.badge || '/favicon.png',
      image: payload.notification?.image || payload.data?.image || undefined,
      tag: payload.data?.bookingId ? `booking-${payload.data.bookingId}` : 'turfbook-booking',
      renotify: true,
      requireInteraction: true,
      data: {
        url: payload.data?.url || payload.fcmOptions?.link || '/?dashboard=owner&tab=bookings',
        bookingId: payload.data?.bookingId || '',
        turfId: payload.data?.turfId || '',
      },
      actions: [
        {
          action: 'view_booking',
          title: '📋 View Request',
        },
        {
          action: 'dismiss',
          title: 'Close',
        },
      ],
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

// Native Web Push event fallback (ensures notifications work even if raw payload arrives)
self.addEventListener('push', function (event) {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    console.log('[FCM SW] Push event raw payload:', payload);

    // If already handled by onBackgroundMessage, we avoid duplicate notifications
    if (payload.notification && messaging) {
      // Handled by Firebase compat layer
      return;
    }

    const title = payload.data?.title || payload.title || 'New TurfBook Booking Request';
    const body = payload.data?.body || payload.body || 'New booking request submitted.';
    const url = payload.data?.url || '/?dashboard=owner&tab=bookings';

    const options = {
      body: body,
      icon: '/favicon.png',
      badge: '/favicon.png',
      data: { url: url },
      requireInteraction: true,
      tag: payload.data?.bookingId ? `booking-${payload.data.bookingId}` : 'turfbook-booking',
      renotify: true,
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.warn('[FCM SW] Could not parse push payload as JSON:', err);
  }
});

// Handle Notification Click
self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/?dashboard=owner&tab=bookings';
  const urlToOpen = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (clientList) {
        // If a window is already open, focus it and navigate to the booking request
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.postMessage({
              type: 'NAVIGATE_BOOKING',
              url: urlToOpen,
              bookingId: event.notification.data?.bookingId,
            });
            return client.focus().then(() => {
              if (client.navigate) {
                return client.navigate(urlToOpen);
              }
            });
          }
        }
        // If no matching window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
