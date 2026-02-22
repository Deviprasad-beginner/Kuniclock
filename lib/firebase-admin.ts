import * as admin from 'firebase-admin';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;

function initAdmin() {
    if (admin.apps.length > 0) return admin.apps[0]!;

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (serviceAccountJson) {
        // Full service account JSON provided
        const serviceAccount = JSON.parse(serviceAccountJson) as admin.ServiceAccount;
        return admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }

    // Fallback: verify tokens using public Firebase keys (no service account needed)
    return admin.initializeApp({
        projectId: PROJECT_ID,
        credential: admin.credential.applicationDefault(),
    });
}

let app: admin.app.App;
try {
    app = initAdmin();
} catch {
    app = admin.apps[0]!;
}

export const adminAuth = admin.auth(app);

/**
 * Verifies a Firebase ID token from the Authorization header.
 * Returns the decoded token (with uid) or throws.
 */
export async function verifyIdToken(authHeader: string | undefined): Promise<admin.auth.DecodedIdToken> {
    if (!authHeader?.startsWith('Bearer ')) {
        throw new Error('Missing or invalid Authorization header');
    }
    const token = authHeader.slice(7);
    return adminAuth.verifyIdToken(token);
}
