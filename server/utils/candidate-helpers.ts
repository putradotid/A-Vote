import type { Timestamp } from 'firebase-admin/firestore'
import type { CandidateListItem } from '~/types'

/**
 * Serialize a Firestore Candidate document snapshot into a JSON-safe CandidateListItem.
 */
export function formatCandidateDoc(doc: FirebaseFirestore.DocumentSnapshot): CandidateListItem {
  const data = doc.data() || {}
  const createdAtDate = data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date()

  return {
    id: doc.id,
    electionId: data.electionId || '',
    number: typeof data.number === 'number' ? data.number : 0,
    name: data.name || '',
    photoUrl: data.photoUrl || null,
    vision: data.vision || '',
    mission: data.mission || '',
    createdAt: createdAtDate.toISOString(),
  }
}
