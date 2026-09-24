import { requireVoter } from '../../../../utils/verify-token'
import { useAdminDb } from '../../../../utils/firebase-admin'
import { formatElectionDoc } from '../../../../utils/election-state'
import type { VoterCandidateItem, VoterCandidateListResponse } from '~/types'

export default defineEventHandler(async (event): Promise<VoterCandidateListResponse> => {
  await requireVoter(event)

  const electionId = getRouterParam(event, 'id')
  if (!electionId) {
    throw createError({
      statusCode: 400,
      message: 'ID pemilihan tidak valid.',
    })
  }

  const db = useAdminDb()
  const electionDoc = await db.collection('elections').doc(electionId).get()

  if (!electionDoc.exists) {
    throw createError({
      statusCode: 404,
      message: 'Pemilihan tidak ditemukan.',
    })
  }

  const formatted = formatElectionDoc(electionDoc)
  if (formatted.computedState === 'DRAFT') {
    throw createError({
      statusCode: 404,
      message: 'Pemilihan tidak ditemukan.',
    })
  }

  // Fetch candidates ordered by number ascending
  const candidatesSnap = await db
    .collection('elections')
    .doc(electionId)
    .collection('candidates')
    .orderBy('number', 'asc')
    .get()

  const candidates: VoterCandidateItem[] = candidatesSnap.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      electionId,
      number: data.number ?? 0,
      name: data.name ?? '',
      photoUrl: data.photoUrl ?? null,
      vision: data.vision ?? '',
      mission: data.mission ?? '',
    }
  })

  return { candidates }
})
