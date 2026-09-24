import { requireAdmin } from '../../../../../utils/verify-token'
import { useAdminDb } from '../../../../../utils/firebase-admin'
import { formatCandidateDoc } from '../../../../../utils/candidate-helpers'
import type { CandidateDetailResponse } from '~/types'

export default defineEventHandler(async (event): Promise<CandidateDetailResponse> => {
  await requireAdmin(event)

  const electionId = getRouterParam(event, 'id')
  const candidateId = getRouterParam(event, 'cid')

  if (!electionId || !candidateId) {
    throw createError({
      statusCode: 400,
      message: 'ID pemilihan atau ID kandidat tidak valid.',
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

  const candidateDoc = await db
    .collection('elections')
    .doc(electionId)
    .collection('candidates')
    .doc(candidateId)
    .get()

  if (!candidateDoc.exists) {
    throw createError({
      statusCode: 404,
      message: 'Kandidat tidak ditemukan.',
    })
  }

  return {
    candidate: formatCandidateDoc(candidateDoc),
  }
})
