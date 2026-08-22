/// <reference types="vite/client" />
// Client-side Firebase Cloud Messaging helper for TurfBook
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, deleteToken, Messaging, isSupported } from 'firebase/messaging';

export interface FirebasePublicConfig {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId: string;
  appId: string;
  vapidKey: string;
}

let cachedConfig: FirebasePublicConfig | null = null;
let firebaseApp: FirebaseApp | null = null;
let messagingInstance: Messaging | null = null;

// Default Firebase configuration provided by project
const DEFAULT_FIREBASE_CONFIG: FirebasePublicConfig = {
  apiKey: "AIzaSyDZjW74kKPZO-qesqpY158JBBBaMalb808",
  authDomain: "turfbook-7b4ec.firebaseapp.com",
  projectId: "turfbook-7b4ec",
  storageBucket: "turfbook-7b4ec.firebasestorage.app",
  messagingSenderId: "190824969167",
  appId: "1:190824969167:web:7ec6d681aa3a7e9d8c18ba",
  vapidKey: "BEhTARgxwOzUZZ_GA0lcOugrMxBQXGNeTPmAFiMm6LXB9gzhzWa_3ch-bka_xf9y6RLfx4iGpufWkG6eTTU8Aw0",
};

// Fetch public Firebase config (reads from VITE env vars or server fallback)
export async function getFirebasePublicConfig(): Promise<FirebasePublicConfig | null> {
  if (cachedConfig) return cachedConfig;

  // 1. Try Vite Client-Side Environment Variables
  const env = (import.meta as any).env || {};
  const viteApiKey = env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey;
  const viteProjectId = env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId;
  const viteSenderId = env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId;
  const viteAppId = env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId;
  const viteVapidKey = env.VITE_FIREBASE_VAPID_KEY || DEFAULT_FIREBASE_CONFIG.vapidKey;

  if (viteApiKey && viteProjectId && viteSenderId && viteAppId) {
    cachedConfig = {
      apiKey: viteApiKey,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain || `${viteProjectId}.firebaseapp.com`,
      projectId: viteProjectId,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket || `${viteProjectId}.firebasestorage.app`,
      messagingSenderId: viteSenderId,
      appId: viteAppId,
      vapidKey: viteVapidKey || '',
    };
    return cachedConfig;
  }

  // 2. Try Server-side runtime public config endpoint (useful for Vercel dynamic envs)
  try {
    const res = await fetch('/api/config/firebase-public');
    if (res.ok) {
      const data = await res.json();
      if (data.configured && data.config) {
        cachedConfig = data.config;
        return cachedConfig;
      }
    }
  } catch (err) {
    console.warn('[FCM Client] Could not fetch server public config:', err);
  }

  cachedConfig = DEFAULT_FIREBASE_CONFIG;
  return cachedConfig;
}

// Check if Push & Service Worker are supported in the current browser
export function isPushNotificationSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

// Get or initialize Firebase App instance
export async function getOrInitFirebaseApp(): Promise<FirebaseApp | null> {
  const config = await getFirebasePublicConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return null;
  }

  if (getApps().length > 0) {
    firebaseApp = getApp();
  } else {
    firebaseApp = initializeApp(config);
  }

  return firebaseApp;
}

// Register service worker with config query parameters
export async function registerFcmServiceWorker(config?: FirebasePublicConfig | null): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;

  try {
    let swUrl = '/firebase-messaging-sw.js';
    if (config) {
      const params = new URLSearchParams();
      if (config.apiKey) params.set('apiKey', config.apiKey);
      if (config.projectId) params.set('projectId', config.projectId);
      if (config.messagingSenderId) params.set('messagingSenderId', config.messagingSenderId);
      if (config.appId) params.set('appId', config.appId);
      swUrl = `/firebase-messaging-sw.js?${params.toString()}`;
    }

    const registration = await navigator.serviceWorker.register(swUrl, {
      scope: '/',
    });
    console.log('[FCM Client] Service worker registered successfully with scope:', registration.scope);
    return registration;
  } catch (err) {
    console.error('[FCM Client] Service worker registration failed:', err);
    throw err;
  }
}

// Request permission and obtain the owner's FCM registration token
export async function requestOwnerFcmToken(): Promise<{
  success: boolean;
  token?: string;
  error?: string;
  permission: NotificationPermission;
}> {
  if (!isPushNotificationSupported()) {
    return {
      success: false,
      error: 'Push notifications are not supported by this browser.',
      permission: 'denied',
    };
  }

  const currentPermission = Notification.permission;
  if (currentPermission === 'denied') {
    return {
      success: false,
      error: 'Notification permission is currently blocked in your browser settings. Please allow notifications for this site to receive booking alerts.',
      permission: 'denied',
    };
  }

  // Request browser permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return {
      success: false,
      error: 'Notification permission was not granted.',
      permission,
    };
  }

  const config = await getFirebasePublicConfig();
  if (!config) {
    return {
      success: false,
      error: 'Firebase Cloud Messaging is not configured on this deployment. Please set the Firebase environment variables in Vercel.',
      permission: 'granted',
    };
  }

  const app = await getOrInitFirebaseApp();
  if (!app) {
    return {
      success: false,
      error: 'Failed to initialize Firebase App.',
      permission: 'granted',
    };
  }

  const supported = await isSupported().catch(() => false);
  if (!supported) {
    return {
      success: false,
      error: 'Firebase Cloud Messaging is not supported in this browser context.',
      permission: 'granted',
    };
  }

  try {
    const swRegistration = await registerFcmServiceWorker(config);
    if (!swRegistration) {
      return {
        success: false,
        error: 'Failed to register Service Worker for notifications.',
        permission: 'granted',
      };
    }

    messagingInstance = getMessaging(app);

    // VAPID key is required for Web Push
    const vapidKey = config.vapidKey || undefined;
    const token = await getToken(messagingInstance, {
      vapidKey: vapidKey,
      serviceWorkerRegistration: swRegistration,
    });

    if (!token) {
      return {
        success: false,
        error: 'FCM token generation returned an empty token.',
        permission: 'granted',
      };
    }

    console.log('[FCM Client] Obtained FCM registration token:', token.substring(0, 15) + '...');
    return {
      success: true,
      token,
      permission: 'granted',
    };
  } catch (err: any) {
    console.error('[FCM Client] Error getting FCM token:', err);
    return {
      success: false,
      error: `Failed to retrieve push token: ${err?.message || 'Unknown error'}`,
      permission: 'granted',
    };
  }
}

// Send FCM token to TurfBook backend
export async function saveTokenToBackend(userId: string, token: string): Promise<boolean> {
  try {
    const res = await fetch('/api/notifications/fcm-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        token,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      }),
    });
    const data = await res.json();
    return data.success === true;
  } catch (err) {
    console.error('[FCM Client] Failed to save token to backend:', err);
    return false;
  }
}

// Remove FCM token from TurfBook backend
export async function removeTokenFromBackend(userId: string, token: string): Promise<boolean> {
  try {
    const res = await fetch('/api/notifications/fcm-token', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, token }),
    });
    const data = await res.json();
    return data.success === true;
  } catch (err) {
    console.error('[FCM Client] Failed to remove token from backend:', err);
    return false;
  }
}

// Listen for foreground FCM push notifications when the tab is open
export async function setupForegroundMessageListener(
  onNotificationReceived: (payload: { title: string; body: string; data?: any }) => void
): Promise<(() => void) | null> {
  const app = await getOrInitFirebaseApp();
  if (!app) return null;

  const supported = await isSupported().catch(() => false);
  if (!supported) return null;

  try {
    const messaging = getMessaging(app);
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('[FCM Client] Foreground message received:', payload);
      const title = payload.notification?.title || payload.data?.title || 'New TurfBook Booking Request';
      const body =
        payload.notification?.body ||
        payload.data?.body ||
        'A customer just submitted a booking request.';

      onNotificationReceived({
        title,
        body,
        data: payload.data,
      });

      // Also trigger a system notification if tab is visible and permission granted
      if (Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body,
            icon: '/favicon.png',
            badge: '/favicon.png',
            tag: payload.data?.bookingId ? `booking-${payload.data.bookingId}` : 'turfbook-booking',
          });
        } catch (e) {
          // In some browsers new Notification() inside page context throws, service worker handles it
        }
      }
    });

    return unsubscribe;
  } catch (err) {
    console.warn('[FCM Client] Could not attach foreground listener:', err);
    return null;
  }
}
