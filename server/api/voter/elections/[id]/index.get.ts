import { requireVoter } from '../../../../utils/verify-token'
import { useAdminDb } from '../../../../utils/firebase-admin'
import { formatElectionDoc } from '../../../../utils/election-state'
import type { VoterElectionDetailResponse } from '~/types'

export default defineEventHandler(async (event): Promise<VoterElectionDetailResponse> => {
  const decodedToken = await requireVoter(event)
  const userId = decodedToken.uid

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

  // Check voter record: voters/${electionId}_${userId}
  const voterDocId = `${electionId}_${userId}`
  const voterDoc = await db.collection('voters').doc(voterDocId).get()

  const isRegistered = voterDoc.exists
  const hasVoted = isRegistered ? voterDoc.data()?.hasVoted === true : false

  return {
    election: {
      id: formatted.id,
      title: formatted.title,
      description: formatted.description,
      startAt: formatted.startAt,
      endAt: formatted.endAt,
      resultPublishedAt: formatted.resultPublishedAt,
      computedState: formatted.computedState,
      isRegistered,
      hasVoted,
    },
  }
})
