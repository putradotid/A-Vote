import { requireAdmin } from '../../../../../utils/verify-token'
import { useAdminDb } from '../../../../../utils/firebase-admin'
import { formatCandidateDoc } from '../../../../../utils/candidate-helpers'
import type { CandidateListResponse } from '~/types'

export default defineEventHandler(async (event): Promise<CandidateListResponse> => {
  await requireAdmin(event)

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

  const candidatesSnap = await db
    .collection('elections')
    .doc(electionId)
    .collection('candidates')
    .orderBy('number', 'asc')
    .get()

  return {
    candidates: candidatesSnap.docs.map(formatCandidateDoc),
  }
})
