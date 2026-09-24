import { requireAdmin } from '../../../../../utils/verify-token'
import { useAdminDb } from '../../../../../utils/firebase-admin'
import { formatVoterDoc } from '../../../../../utils/voter-helpers'
import type { VoterDetailResponse } from '~/types'

export default defineEventHandler(async (event): Promise<VoterDetailResponse> => {
  await requireAdmin(event)

  const electionId = getRouterParam(event, 'id')
  const voterId = getRouterParam(event, 'vid')

  if (!electionId || !voterId) {
    throw createError({
      statusCode: 400,
      message: 'ID pemilihan atau ID pemilih tidak valid.',
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

  const voterDoc = await db.collection('voters').doc(voterId).get()

  if (!voterDoc.exists) {
    throw createError({
      statusCode: 404,
      message: 'Pemilih tidak ditemukan.',
    })
  }

  // Verify the voter belongs to this election
  const voterData = voterDoc.data() || {}
  if (voterData.electionId !== electionId) {
    throw createError({
      statusCode: 404,
      message: 'Pemilih tidak ditemukan dalam pemilihan ini.',
    })
  }

  return {
    voter: await formatVoterDoc(voterDoc),
  }
})
