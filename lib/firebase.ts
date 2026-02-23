import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Provide fallback dummy values to prevent Vercel static build from fatally crashing
// if environment variables aren't injected into the Next.js build environment.
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'dummy_api_key',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'dummy_auth_domain',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dummy_project_id',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'dummy_storage_bucket',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'dummy_sender_id',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:1111111111:web:1111111111',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
