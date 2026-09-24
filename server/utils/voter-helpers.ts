import type { Timestamp } from 'firebase-admin/firestore'
import type { VoterListItem } from '~/types'
import { useAdminDb } from './firebase-admin'

/**
 * Serialize a Firestore Voter document snapshot into a JSON-safe VoterListItem.
 * Joins user profile (name, nim) from the users collection.
 *
 * SECURITY: Never includes dateOfBirthHash or other sensitive credentials.
 */
export async function formatVoterDoc(doc: FirebaseFirestore.DocumentSnapshot): Promise<VoterListItem> {
  const data = doc.data() || {}
  const createdAtDate = data.createdAt && typeof data.createdAt.toDate === 'function' ? (data.createdAt as Timestamp).toDate() : new Date()
  const userId = data.userId || ''

  // Lookup user profile for denormalized name/nim
  let nim = ''
  let name = ''

  if (userId) {
    const db = useAdminDb()
    const userDoc = await db.collection('users').doc(userId).get()
    if (userDoc.exists) {
      const userData = userDoc.data() || {}
      nim = userData.nim || ''
      name = userData.name || ''
    }
  }

  return {
    id: doc.id,
    electionId: data.electionId || '',
    userId,
    nim,
    name,
    hasVoted: data.hasVoted === true,
    createdAt: createdAtDate.toISOString(),
  }
}

/**
 * Batch format multiple voter documents, resolving user profiles efficiently.
 * Performs a single batch read of user documents instead of N+1 queries.
 *
 * SECURITY: Never includes dateOfBirthHash or other sensitive credentials.
 */
export async function formatVoterDocs(docs: FirebaseFirestore.DocumentSnapshot[]): Promise<VoterListItem[]> {
  if (docs.length === 0) return []

  const db = useAdminDb()

  // Collect unique userIds
  const userIds = new Set<string>()
  for (const doc of docs) {
    const data = doc.data() || {}
    if (data.userId) {
      userIds.add(data.userId)
    }
  }

  // Batch fetch user profiles (Firestore getAll supports up to 100 refs at a time)
  const userProfiles = new Map<string, { nim: string; name: string }>()
  const userIdArray = Array.from(userIds)

  // Process in chunks of 100 (Firestore batch limit)
  for (let i = 0; i < userIdArray.length; i += 100) {
    const chunk = userIdArray.slice(i, i + 100)
    const refs = chunk.map(uid => db.collection('users').doc(uid))
    const userDocs = await db.getAll(...refs)

    for (const userDoc of userDocs) {
      if (userDoc.exists) {
        const userData = userDoc.data() || {}
        userProfiles.set(userDoc.id, {
          nim: userData.nim || '',
          name: userData.name || '',
        })
      }
    }
  }

  // Map voter docs with resolved profiles
  return docs.map(doc => {
    const data = doc.data() || {}
    const createdAtDate = data.createdAt && typeof data.createdAt.toDate === 'function' ? (data.createdAt as Timestamp).toDate() : new Date()
    const userId = data.userId || ''
    const profile = userProfiles.get(userId)

    return {
      id: doc.id,
      electionId: data.electionId || '',
      userId,
      nim: profile?.nim || '',
      name: profile?.name || '',
      hasVoted: data.hasVoted === true,
      createdAt: createdAtDate.toISOString(),
    }
  })
}
