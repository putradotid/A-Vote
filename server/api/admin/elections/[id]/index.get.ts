import { requireAdmin } from '../../../../utils/verify-token'
import { useAdminDb } from '../../../../utils/firebase-admin'
import { formatElectionDoc } from '../../../../utils/election-state'
import type { ElectionDetailResponse } from '~/types'

export default defineEventHandler(async (event): Promise<ElectionDetailResponse> => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID pemilihan tidak valid.',
    })
  }

  const db = useAdminDb()
  const doc = await db.collection('elections').doc(id).get()

  if (!doc.exists) {
    throw createError({
      statusCode: 404,
      message: 'Pemilihan tidak ditemukan.',
    })
  }

  return {
    election: formatElectionDoc(doc),
  }
})
