import * as admin from 'firebase-admin';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;

function getAdminApp(): admin.app.App {
    if (admin.apps.length > 0) return admin.apps[0]!;

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (serviceAccountJson && serviceAccountJson.trim().startsWith('{')) {
        // Full service account JSON provided — use it
        try {
            const serviceAccount = JSON.parse(serviceAccountJson) as admin.ServiceAccount;
            return admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        } catch {
            console.warn('[firebase-admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON, falling back to project-only init');
        }
    }

    // No service account — initialize with project ID only.
    // verifyIdToken still works because Firebase Admin fetches Google's
    // public JWKS certs from:
    // https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com
    return admin.initializeApp({ projectId: PROJECT_ID });
}

export const adminAuth = admin.auth(getAdminApp());

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
    return adminAuth.verifyIdToken(token);
}
