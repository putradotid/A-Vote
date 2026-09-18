import { requireAdmin } from '../../../../utils/verify-token'
import { useAdminDb } from '../../../../utils/firebase-admin'
import { formatElectionDoc } from '../../../../utils/election-state'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID pemilihan tidak valid.',
    })
  }

  const db = useAdminDb()
  const docRef = db.collection('elections').doc(id)
  const doc = await docRef.get()

  if (!doc.exists) {
    throw createError({
      statusCode: 404,
      message: 'Pemilihan tidak ditemukan.',
    })
  }

  const currentFormatted = formatElectionDoc(doc)
  const currentState = currentFormatted.computedState

  if (currentState !== 'DRAFT' && currentState !== 'CANCELLED') {
    throw createError({
      statusCode: 400,
      message: 'Pemilihan hanya dapat dihapus jika berstatus DRAFT atau CANCELLED.',
    })
  }

  // Safety check: ensure no candidate subcollection documents exist
  const candidatesSnap = await docRef.collection('candidates').limit(1).get()
  if (!candidatesSnap.empty) {
    throw createError({
      statusCode: 400,
      message: 'Hapus semua kandidat terlebih dahulu sebelum menghapus pemilihan.',
    })
  }

  // Safety check: ensure no voter eligibility documents exist
  const votersSnap = await db.collection('voters').where('electionId', '==', id).limit(1).get()
  if (!votersSnap.empty) {
    throw createError({
      statusCode: 400,
      message: 'Hapus data pemilih terlebih dahulu sebelum menghapus pemilihan.',
    })
  }

  await docRef.delete()

  return {
    success: true,
    message: 'Pemilihan berhasil dihapus.',
  }
})
