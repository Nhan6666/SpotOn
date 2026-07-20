import { initializeApp, getApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
// @ts-ignore - getReactNativePersistence is exported from react-native specific bundle
import { getReactNativePersistence } from '@firebase/auth/dist/rn/index.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

let app: any;
let auth: any;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error: any) {
  if (error.code === 'auth/already-initialized') {
    auth = getAuth(app);
  } else {
    console.warn('Firebase initialization error:', error.message);
    try {
      app = getApp();
      auth = getAuth(app);
    } catch {
      console.error('Firebase completely failed to initialize.');
    }
  }
}

export { app, auth };
