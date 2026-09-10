import { createHash } from 'node:crypto'
import { useAdminAuth, useAdminDb } from '../../utils/firebase-admin'
import type { StudentLoginRequest, StudentLoginResponse } from '~/types'

export default defineEventHandler(async (event): Promise<StudentLoginResponse> => {
  const body = await readBody<Partial<StudentLoginRequest>>(event)

  const nim = body?.nim?.trim()
  const dateOfBirth = body?.dateOfBirth?.trim()

  if (!nim || !dateOfBirth) {
    throw createError({
      statusCode: 400,
      message: 'NIM dan Tanggal Lahir wajib diisi.',
    })
  }

  // Validate format YYYY-MM-DD
  const dobRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dobRegex.test(dateOfBirth)) {
    throw createError({
      statusCode: 400,
      message: 'Format Tanggal Lahir tidak valid (harus YYYY-MM-DD).',
    })
  }

  // Generic error to avoid revealing user/NIM existence (rules.md § Authentication)
  const genericAuthError = createError({
    statusCode: 401,
    message: 'NIM atau Tanggal Lahir tidak sesuai.',
  })

  try {
    const db = useAdminDb()
    const usersRef = db.collection('users')

    // Find student by NIM and voter role
    const querySnapshot = await usersRef
      .where('nim', '==', nim)
      .where('role', '==', 'voter')
      .limit(1)
      .get()

    if (querySnapshot.empty) {
      throw genericAuthError
    }

    const userDoc = querySnapshot.docs[0]!
    const userData = userDoc.data()

    // Hash the input Date of Birth with SHA-256 and compare with stored hash
    const inputHash = createHash('sha256').update(dateOfBirth).digest('hex')

    if (!userData.dateOfBirthHash || userData.dateOfBirthHash !== inputHash) {
      throw genericAuthError
    }

    // Generate Firebase Custom Token with voter role claim
    const adminAuth = useAdminAuth()
    const uid = userData.uid || userDoc.id
    const customToken = await adminAuth.createCustomToken(uid, { role: 'voter' })

    return {
      customToken,
    }
  }
  catch (error: unknown) {
    // If it's already an H3 error (e.g. genericAuthError), rethrow it directly
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('[Student Auth Error]:', error)
    throw createError({
      statusCode: 500,
      message: 'Terjadi kesalahan pada server saat memproses login.',
    })
  }
})
