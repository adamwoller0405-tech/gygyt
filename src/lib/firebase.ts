/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB0JIVV4aDW0DWz3rsdLmTkZrfN_FhVxLQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gygyt-hub.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gygyt-hub",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gygyt-hub.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID || "100195782150",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:100195782150:web:899e6472deeed8224f7d87"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

let messaging: ReturnType<typeof getMessaging> | null = null;
try { messaging = getMessaging(app); } catch {}

export const requestNotificationPermission = async (): Promise<string | null> => {
  if (!messaging || !('Notification' in window)) return null;
  try {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return null;
    const token = await getToken(messaging, { vapidKey: 'BIPUfD1q7s3oCNJQKStAV3a6i90Q3WtKd7qL5jRqx_mMqVY3mhXHgeG8JmO_c74VC7F2vXXas_HUFmYqDTUAYGM' });
    return token;
  } catch { return null; }
};

export const onForegroundMessage = (cb: (payload: any) => void) => {
  if (!messaging) return () => {};
  return onMessage(messaging, cb);
};

export const showBrowserNotification = (title: string, options?: NotificationOptions) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try { new Notification(title, { icon: '/logo.svg', badge: '/logo.svg', ...options }); } catch {}
};

/**
 * CLOUDINARY CONFIGURATION (100% FREE / NO CREDIT CARD)
 * 1. Create a free account on Cloudinary.com
 * 2. Go to Settings -> Upload -> Add upload preset
 * 3. Name it 'gygyt_preset' and set 'Signing Mode' to 'Unsigned'
 */
const CLOUDINARY_CLOUD_NAME = "dbqaylbyz";
const CLOUDINARY_UPLOAD_PRESET = "gygyt_preset";

/**
 * Utility to upload a file to Cloudinary
 */
export const uploadFile = async (blob: Blob): Promise<string> => {
  const formData = new FormData();
  formData.append('file', blob);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Upload failed');
  }

  const data = await response.json();
  return data.secure_url;
};
