import * as admin from 'firebase-admin';

// Initialize the app lazily to prevent Next.js build from crashing 
// if environment variables are missing during static generation (Vercel).
function getAdminAuth() {
    if (admin.apps.length > 0) return admin.auth(admin.apps[0]!);

    const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project-id';
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (serviceAccountJson && serviceAccountJson.trim().startsWith('{')) {
        try {
            const serviceAccount = JSON.parse(serviceAccountJson) as admin.ServiceAccount;
            const app = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
            return admin.auth(app);
        } catch {
            console.warn('[firebase-admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON');
        }
    }

    const app = admin.initializeApp({ projectId: PROJECT_ID });
    return admin.auth(app);
}

/**
 * Verifies a Firebase ID token from the Authorization header.
 * Returns the decoded token (with uid) or throws.
 */
export async function verifyIdToken(
    authHeader: string | undefined,
): Promise<admin.auth.DecodedIdToken> {
    if (!authHeader?.startsWith('Bearer ')) {
        throw new Error('Missing or invalid Authorization header');
    }
    const token = authHeader.slice(7);
    return getAdminAuth().verifyIdToken(token);
}
