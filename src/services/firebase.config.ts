import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider, CustomProvider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoKeyForVetmindLocalDev123',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'vetmind-app.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'vetmind-app',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'vetmind-app.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1029384756',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1029384756:web:abcd1234efgh5678',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize App Check for Firebase Security Enforcement
const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APPCHECK_KEY;
const isTestEnv = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test';

if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined' && !isTestEnv) {
  if (appCheckSiteKey) {
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(appCheckSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (err) {
      console.warn('[AppCheck] Initialization skipped or already initialized:', err);
    }
  } else if (import.meta.env.DEV) {
    try {
      (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      initializeAppCheck(app, {
        provider: new CustomProvider({
          getToken: () =>
            Promise.resolve({
              token: 'vetmind-dev-appcheck-debug-token',
              expireTimeMillis: Date.now() + 3600000,
            }),
        }),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (err) {
      // Graceful fallback in test runner
    }
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
