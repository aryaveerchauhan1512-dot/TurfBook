// Server-side Firebase Cloud Messaging (FCM) Service using Firebase Admin SDK
import { initializeApp, getApps, cert, applicationDefault, App } from 'firebase-admin/app';
import { getMessaging, MulticastMessage } from 'firebase-admin/messaging';

let adminApp: App | null = null;
let initError: string | null = null;

// Default Service Account configuration for turfbook-7b4ec
const DEFAULT_SERVICE_ACCOUNT = {
  type: "service_account",
  project_id: "turfbook-7b4ec",
  private_key_id: "a71b4c95525063b54568e6ab51115ee5d5b7bc84",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDCUnk+l4Oka2aF\n6GZsYAwzJd/QdWQdyC+IC/m3++DYHK2XeAS8wMDFm74hTRYT2sOU3b4mx5izcIS5\n4OPtwkh9yU52Cy8sjr+hVKGlYzVyZsc5CY9Oljllb9YKlQPpEB97OoyDq51gnpVn\nT3VuZVYo/IM3MVY9jW7uvX6op85I6YQa3it3/44zeMTOsBeKSVjdoxLXyWHssWkO\nsw1Vg4KWios5o3TzXYRYYPZxZxbPi54R46s9ZCxp7FDxCs/iMXP79hPzDqhFHMGF\npwqQ2iylfj89hlFYdZPV8lWB41QGYe27jJ40pRSnsOypaP0aAHf2j8l1Oi8PB6VP\n98fGwvNPAgMBAAECggEAEySdIBmR/4kQX6xeJrABk6pYAEkIP1eAuIt2zXVT7Zue\n+EHRCafddboa2AdS36At+Jotnilh4CTQq8pn+dH+t9w0eAmFsK3cBUXOlM86AoFL\nKqcdRdXOZVvylIv13NMDSZhMzmMszPS3wtEqQDazGbTigktAc9jdLvSzp7lm53oO\n0KrS+dwDbRFx8HqQ+1pDLouX92px//vEBPnFg/ZdghSBPaEIFWKdTixU9y+BpmO8\nucx7XUYDxvbb+xt2ydClfp2tp93W2HcIIJsEDAIqU2AiHoq7Q70BB+Lj13tEoNwv\nLhE07icZ0FoHYZBqye3haFlLBQosGxpN72I5qTqxoQKBgQD3IPnso55IJYrJhR5j\n9sqLPmOLJE82vIRzvZmIt3ZjhvgADPfZ0x3uo8wJcxZfINHHNI8x9ih6K14DzJjH\ngvjSk1+s0lEUsRu6fTZY+4zFv186oH/Ba4ViPXN2gujYZgmGM1TkpKwtYIA/+NFu\nK9HwX12HihapOEBA3p+INlBIIQKBgQDJTDk1GCitzPi1CJzAspRVOEEdnkzIoRtz\nqIpoXNd1yd7LgtzuZgPNRCthO4u01ptr8QWtwRGcOaCCqSLwDC+VjH3+LIEQ0fcT\n6Gb+IxbriISB7ugGTRw0Ellv6M1QnmBzwunrzOqLSz2qIpst2Tm+kn8HbNpLARq2\ng9RUtQoNbwKBgEIOsH+OpMqILnb7fEogN7fMr3ML+5iX/5eogJfI4n5sH3J0BPRW\nuFOHuQx1lO9MqIZlCDnEoME3QmQlllkOK1CuUA60ETREuzK4MYTLiK97Hgtfx4Z+\nJSNDZc+x4melrroOkoyjb9qZRu7SpbibQfzMoQWP5crJ3HL6jw4r5n3BAoGAL5Sv\n1Qf/3Y0coJYHj1jmzPn+EkUvuyCxv3XwOVjwqOvtmMc297bvYR6i7lnH3Rf5JtuS\nzw5a3kWU1i2qj3kh6kSKJ4FXhKVMtMzzQ1ECAuyC/b994rdpWjmYIGaz2UGGZPaG\nmnEWY5SGX+fMLFszVgOEuTmWo7IAIXIpx1f/p0sCgYBr0Oxdnb58j7m6/8A/sMue\nsJhL1IYpFLBR4Cw7XWU2X24raBvtMjSy+1+PX2L6I1M+mKsbG1VKIbmjEkF9uGxz\nZXQVLNUGVz6cDDl+U7eEBEC3H3eaUT0+H2Ex4sj6VPdT81TIH2OhL9AvbtY6xmG+\nLCw+pd+ZZy4APyxitdz3yA==\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@turfbook-7b4ec.iam.gserviceaccount.com",
  client_id: "101511361823738931597",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40turfbook-7b4ec.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

// Initialize Firebase Admin SDK safely with various credential formats
export function initializeFirebaseAdmin(): { success: boolean; error?: string } {
  if (adminApp && getApps().length > 0) {
    return { success: true };
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return { success: true };
  }

  try {
    // 1. Full Service Account JSON String (Direct or Base64)
    const serviceAccountJson =
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
      process.env.FIREBASE_SERVICE_ACCOUNT ||
      process.env.FIREBASE_CREDENTIALS ||
      process.env.FIREBASE_ADMIN_KEY ||
      '';

    if (serviceAccountJson) {
      let parsedCreds: any;
      try {
        if (serviceAccountJson.trim().startsWith('{')) {
          parsedCreds = JSON.parse(serviceAccountJson);
        } else {
          // Attempt Base64 decode
          const decoded = Buffer.from(serviceAccountJson.trim(), 'base64').toString('utf8');
          parsedCreds = JSON.parse(decoded);
        }
      } catch (err: any) {
        initError = `Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON: ${err?.message}`;
        console.error(`[FCM Admin] ${initError}`);
        return { success: false, error: initError };
      }

      adminApp = initializeApp({
        credential: cert(parsedCreds),
      });
      console.log('[FCM Admin] Initialized with Service Account JSON.');
      return { success: true };
    }

    // 2. Individual Environment Variables
    const projectId =
      process.env.FIREBASE_PROJECT_ID ||
      process.env.VITE_FIREBASE_PROJECT_ID ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail =
      process.env.FIREBASE_CLIENT_EMAIL ||
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const rawPrivateKey =
      process.env.FIREBASE_PRIVATE_KEY ||
      process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    if (projectId && clientEmail && rawPrivateKey) {
      // Fix multiline private key escaping in environment variables
      const privateKey = rawPrivateKey.replace(/\\n/g, '\n').replace(/^["']|["']$/g, '');

      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('[FCM Admin] Initialized with individual environment credentials for project:', projectId);
      return { success: true };
    }

    // 3. Fallback to default Service Account config for turfbook-7b4ec
    try {
      adminApp = initializeApp({
        credential: cert(DEFAULT_SERVICE_ACCOUNT as any),
      });
      console.log('[FCM Admin] Initialized with project default service account key.');
      return { success: true };
    } catch (e: any) {
      console.warn('[FCM Admin] Could not initialize with default service account:', e?.message);
    }

    // 4. Default Application Credentials (GCP / Cloud Run environment fallback)
    try {
      adminApp = initializeApp({
        credential: applicationDefault(),
      });
      console.log('[FCM Admin] Initialized with default application credentials.');
      return { success: true };
    } catch (e) {
      // Not in GCP default credential environment
    }

    initError = 'Firebase Admin credentials not configured in environment variables.';
    return { success: false, error: initError };
  } catch (err: any) {
    initError = err?.message || 'Firebase Admin initialization failed';
    console.error('[FCM Admin] Initialization error:', err);
    return { success: false, error: initError };
  }
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  bookingId?: string;
  turfId?: string;
  turfName?: string;
  data?: Record<string, string>;
}

export interface PushSendResult {
  success: boolean;
  sentCount: number;
  failureCount: number;
  staleTokensRemoved?: string[];
  error?: string;
}

// Send FCM Push Notification to all devices registered for a specific owner/user
export async function sendFcmPushToTokens(
  tokens: string[],
  payload: PushNotificationPayload
): Promise<PushSendResult> {
  if (!tokens || tokens.length === 0) {
    return {
      success: false,
      sentCount: 0,
      failureCount: 0,
      error: 'No FCM registration tokens registered for this user.',
    };
  }

  const init = initializeFirebaseAdmin();
  if (!init.success) {
    console.warn('[FCM Admin] Cannot send push notification: Firebase Admin is not configured.');
    return {
      success: false,
      sentCount: 0,
      failureCount: tokens.length,
      error: init.error || 'Firebase Admin not configured.',
    };
  }

  const destinationUrl = payload.url || '/?dashboard=owner&tab=bookings';

  const message: MulticastMessage = {
    tokens: tokens,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: {
      title: payload.title,
      body: payload.body,
      url: destinationUrl,
      bookingId: payload.bookingId || '',
      turfId: payload.turfId || '',
      turfName: payload.turfName || '',
      click_action: destinationUrl,
      ...(payload.data || {}),
    },
    webpush: {
      fcmOptions: {
        link: destinationUrl,
      },
      headers: {
        Urgency: 'high',
      },
      notification: {
        title: payload.title,
        body: payload.body,
        icon: '/favicon.png',
        badge: '/favicon.png',
        requireInteraction: true,
        tag: payload.bookingId ? `booking-${payload.bookingId}` : 'turfbook-booking',
        data: {
          url: destinationUrl,
          bookingId: payload.bookingId || '',
          turfId: payload.turfId || '',
        },
      },
    },
  };

  try {
    const messaging = getMessaging(adminApp!);
    const response = await messaging.sendEachForMulticast(message);
    console.log(
      `[FCM Admin] Push sent to ${tokens.length} devices: ${response.successCount} succeeded, ${response.failureCount} failed.`
    );

    const staleTokens: string[] = [];
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          console.warn(`[FCM Admin] Device token failure [${errorCode}]:`, resp.error?.message);
          // Token expired or invalid -> collect for cleanup
          if (
            errorCode === 'messaging/registration-token-not-registered' ||
            errorCode === 'messaging/invalid-registration-token' ||
            errorCode === 'messaging/mismatched-credential'
          ) {
            staleTokens.push(tokens[idx]);
          }
        }
      });
    }

    return {
      success: response.successCount > 0,
      sentCount: response.successCount,
      failureCount: response.failureCount,
      staleTokensRemoved: staleTokens,
    };
  } catch (sendErr: any) {
    console.error('[FCM Admin] Fatal error during sendEachForMulticast:', sendErr);
    return {
      success: false,
      sentCount: 0,
      failureCount: tokens.length,
      error: sendErr?.message || 'Failed to send FCM message',
    };
  }
}
