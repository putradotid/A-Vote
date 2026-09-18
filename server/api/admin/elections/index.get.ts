import { requireAdmin } from '../../../utils/verify-token'
import { useAdminDb } from '../../../utils/firebase-admin'
import { formatElectionDoc } from '../../../utils/election-state'
import type { ElectionListResponse } from '~/types'

export default defineEventHandler(async (event): Promise<ElectionListResponse> => {
  await requireAdmin(event)

  const db = useAdminDb()
  const snapshot = await db.collection('elections').orderBy('createdAt', 'desc').get()

  const elections = snapshot.docs.map(doc => formatElectionDoc(doc))

  return {
    elections,
  }
})
