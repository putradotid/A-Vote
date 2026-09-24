import { requireAdmin } from '../../../../utils/verify-token'
import { useAdminDb } from '../../../../utils/firebase-admin'
import { formatElectionDoc } from '../../../../utils/election-state'
import { FieldValue, type Timestamp } from 'firebase-admin/firestore'

export default defineEventHandler(async (event) => {
  // 1. Require admin role
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID pemilihan tidak valid.',
    })
  }

  const db = useAdminDb()
  const electionRef = db.collection('elections').doc(id)
  const electionDoc = await electionRef.get()

  if (!electionDoc.exists) {
    throw createError({
      statusCode: 404,
      message: 'Pemilihan tidak ditemukan.',
    })
  }

  const formattedElection = formatElectionDoc(electionDoc)
  const currentState = formattedElection.computedState

  if (currentState === 'CANCELLED' || currentState === 'DRAFT') {
    throw createError({
      statusCode: 400,
      message: `Pemilihan berstatus ${currentState} tidak dapat dipublikasikan.`,
    })
  }

  if (currentState === 'RESULT_PUBLISHED') {
    throw createError({
      statusCode: 400,
      message: 'Hasil pemilihan sudah dipublikasikan sebelumnya.',
    })
  }

  // Guard: manual publish only permitted after election has ended (now >= endAt)
  const data = electionDoc.data() || {}
  const endAtDate = data.endAt ? (data.endAt as Timestamp).toDate() : null
  const now = new Date()

  if (!endAtDate || now < endAtDate || currentState === 'ACTIVE' || currentState === 'SCHEDULED') {
    throw createError({
      statusCode: 400,
      message: 'Hasil pemilihan hanya dapat dipublikasikan setelah masa pemungutan suara berakhir (status ENDED).',
    })
  }

  // Update resultPublishedAt to current server timestamp
  await electionRef.update({
    resultPublishedAt: FieldValue.serverTimestamp(),
  })

  // Read back updated document
  const updatedDoc = await electionRef.get()
  const updatedFormatted = formatElectionDoc(updatedDoc)

  return {
    success: true,
    message: 'Hasil pemilihan berhasil dipublikasikan secara resmi.',
    resultPublishedAt: updatedFormatted.resultPublishedAt,
    computedState: updatedFormatted.computedState,
  }
})
