import { requireAdmin } from '../../../../../utils/verify-token'
import { useAdminDb } from '../../../../../utils/firebase-admin'
import { formatElectionDoc } from '../../../../../utils/election-state'
import { formatVoterDoc } from '../../../../../utils/voter-helpers'
import { FieldValue } from 'firebase-admin/firestore'
import type { AddVoterRequest, VoterDetailResponse } from '~/types'

export default defineEventHandler(async (event): Promise<VoterDetailResponse> => {
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

  // Check election lifecycle — only DRAFT or SCHEDULED allowed
  const formattedElection = formatElectionDoc(electionDoc)
  const currentState = formattedElection.computedState

  if (currentState !== 'DRAFT' && currentState !== 'SCHEDULED') {
    throw createError({
      statusCode: 400,
      message: `Pemilih hanya dapat ditambahkan saat pemilihan berstatus DRAFT atau SCHEDULED. Status saat ini: ${currentState}`,
    })
  }

  const body = await readBody<AddVoterRequest>(event)

  if (!body) {
    throw createError({
      statusCode: 400,
      message: 'Data pemilih wajib dikirimkan.',
    })
  }

  // 1. Validate NIM
  const nim = typeof body.nim === 'string' ? body.nim.trim() : ''
  if (!nim || nim.length < 4 || nim.length > 25) {
    throw createError({
      statusCode: 400,
      message: 'NIM wajib diisi (antara 4 sampai 25 karakter).',
    })
  }

  // 2. Find user by NIM in users collection (must be a voter role)
  const usersSnap = await db
    .collection('users')
    .where('nim', '==', nim)
    .where('role', '==', 'voter')
    .limit(1)
    .get()

  if (usersSnap.empty) {
    throw createError({
      statusCode: 404,
      message: `Mahasiswa dengan NIM ${nim} belum terdaftar dalam sistem.`,
    })
  }

  const userDoc = usersSnap.docs[0]!
  const userId = userDoc.id

  // 3. Check for duplicate: deterministic document ID = ${electionId}_${userId}
  const voterDocId = `${electionId}_${userId}`
  const existingVoterDoc = await db.collection('voters').doc(voterDocId).get()

  if (existingVoterDoc.exists) {
    throw createError({
      statusCode: 409,
      message: `Mahasiswa dengan NIM ${nim} sudah terdaftar dalam DPT pemilihan ini.`,
    })
  }

  // 4. Create voter document with deterministic ID
  const voterRef = db.collection('voters').doc(voterDocId)
  const voterData = {
    electionId,
    userId,
    hasVoted: false,
    createdAt: FieldValue.serverTimestamp(),
  }

  await voterRef.set(voterData)

  // 5. Read back the saved document for response
  const savedDoc = await voterRef.get()

  setResponseStatus(event, 201)

  return {
    voter: await formatVoterDoc(savedDoc),
  }
})
