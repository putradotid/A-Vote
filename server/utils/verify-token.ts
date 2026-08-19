/**
 * Server-side Firebase ID Token verification helper.
 *
 * Every privileged Nuxt Server API route must call this as the first step.
 * Returns the verified decoded token containing the user's UID.
 *
 * Rules:
 * - Never trust the uid from the request body. Only use the verified uid.
 * - Reject if the Authorization header is missing or malformed.
 * - Reject if the token is expired, invalid, or revoked.
 *
 * Source of truth: .agent/architecture.md § Token Verification
 * Rules: .agent/rules.md § Firebase (Server / Admin SDK)
 *
 * Phase 2: Includes role verification from Firestore and requireAdmin() helper.
 */

import type { H3Event } from 'h3'
import { useAdminAuth, useAdminDb } from './firebase-admin'
import type { DecodedIdToken } from 'firebase-admin/auth'

/**
 * Extract and verify the Firebase ID Token from the Authorization header.
 * Throws a 401 H3 error if the token is missing or invalid.
 *
 * @returns The decoded Firebase ID token containing the verified uid.
 */
export async function verifyToken(event: H3Event): Promise<DecodedIdToken> {
  const authorization = getHeader(event, 'authorization')

  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  const idToken = authorization.slice(7) // Remove 'Bearer ' prefix

  try {
    const auth = useAdminAuth()
    const decodedToken = await auth.verifyIdToken(idToken)
    return decodedToken
  }
  catch {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }
}

/**
 * Verify ID Token and ensure the user has the 'admin' role in Firestore.
 * Throws a 403 H3 error if the user is not an admin.
 */
export async function requireAdmin(event: H3Event): Promise<DecodedIdToken> {
  const decodedToken = await verifyToken(event)

  const db = useAdminDb()
  const userDoc = await db.collection('users').doc(decodedToken.uid).get()

  if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
    throw createError({
      statusCode: 403,
      message: 'Forbidden: Admin access required',
    })
  }

  return decodedToken
}
