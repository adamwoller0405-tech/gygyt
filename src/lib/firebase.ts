/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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
