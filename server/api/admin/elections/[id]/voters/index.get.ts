import { requireAdmin } from '../../../../../utils/verify-token'
import { useAdminDb } from '../../../../../utils/firebase-admin'
import { formatVoterDocs } from '../../../../../utils/voter-helpers'
import type { VoterListResponse } from '~/types'

export default defineEventHandler(async (event): Promise<VoterListResponse> => {
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

  // Query voters collection (root) by electionId
  const votersSnap = await db
    .collection('voters')
    .where('electionId', '==', electionId)
    .get()

  const voters = await formatVoterDocs(votersSnap.docs)
  // Sort descending by createdAt
  voters.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const totalCount = voters.length
  const votedCount = voters.filter(v => v.hasVoted).length

  return {
    voters,
    totalCount,
    votedCount,
  }
})
