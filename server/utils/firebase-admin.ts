/**
 * Firebase Admin SDK — Server-Side Singleton
 *
 * CRITICAL RULES:
 * - This file is server-only. It MUST NOT be imported by client code.
 * - Credentials come from private runtime config (never exposed to client).
 * - The Admin SDK bypasses Firestore Security Rules (privileged access).
 *   Only use it for operations that require server authority.
 *
 * Source of truth: .agent/architecture.md § Authentication Architecture
 * Rules: .agent/rules.md § Firebase (Server / Admin SDK)
 *
 * Phase 1: Establishes the Admin SDK singleton and exports auth/db handles.
 * Phase 3 will add: atomic vote transaction, result aggregation helpers.
 */

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

let adminApp: App
let adminAuth: Auth
let adminDb: Firestore

function getAdminApp(): App {
  if (adminApp) return adminApp

  const config = useRuntimeConfig()

  // Replace literal \n in the private key (required when set via env var)
  const privateKey = config.firebaseAdminPrivateKey?.replace(/\\n/g, '\n')

  if (!config.firebaseAdminProjectId || !config.firebaseAdminClientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin SDK credentials are not configured. '
      + 'Set NUXT_FIREBASE_ADMIN_PROJECT_ID, NUXT_FIREBASE_ADMIN_CLIENT_EMAIL, '
      + 'and NUXT_FIREBASE_ADMIN_PRIVATE_KEY in your environment.',
    )
  }

  if (getApps().length === 0) {
    adminApp = initializeApp({
      credential: cert({
        projectId: config.firebaseAdminProjectId,
        clientEmail: config.firebaseAdminClientEmail,
        privateKey,
      }),
    })
  }
  else {
    adminApp = getApps()[0]!
  }

  return adminApp
}

export function useAdminAuth(): Auth {
  if (adminAuth) return adminAuth
  adminAuth = getAuth(getAdminApp())
  return adminAuth
}

export function useAdminDb(): Firestore {
  if (adminDb) return adminDb
  adminDb = getFirestore(getAdminApp())
  return adminDb
}
