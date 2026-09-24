import { requireAdmin } from '../../../../../utils/verify-token'
import { useAdminDb } from '../../../../../utils/firebase-admin'
import { formatElectionDoc } from '../../../../../utils/election-state'
import { formatCandidateDoc } from '../../../../../utils/candidate-helpers'
import { FieldValue } from 'firebase-admin/firestore'
import type { CreateCandidateRequest, CandidateDetailResponse } from '~/types'

export default defineEventHandler(async (event): Promise<CandidateDetailResponse> => {
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

  const formattedElection = formatElectionDoc(electionDoc)
  const currentState = formattedElection.computedState

  if (currentState !== 'DRAFT' && currentState !== 'SCHEDULED') {
    throw createError({
      statusCode: 400,
      message: `Kandidat hanya dapat ditambahkan saat pemilihan berstatus DRAFT atau SCHEDULED. Status saat ini: ${currentState}`,
    })
  }

  const body = await readBody<CreateCandidateRequest>(event)

  if (!body) {
    throw createError({
      statusCode: 400,
      message: 'Data kandidat wajib dikirimkan.',
    })
  }

  // 1. Validate number
  if (body.number === undefined || body.number === null || typeof body.number !== 'number' || !Number.isInteger(body.number) || body.number < 1) {
    throw createError({
      statusCode: 400,
      message: 'Nomor urut paslon wajib berupa bilangan bulat positif (>= 1).',
    })
  }

  // 2. Validate name
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name || name.length < 2 || name.length > 150) {
    throw createError({
      statusCode: 400,
      message: 'Nama kandidat wajib diisi (antara 2 sampai 150 karakter).',
    })
  }

  // 3. Validate vision
  const vision = typeof body.vision === 'string' ? body.vision.trim() : ''
  if (!vision) {
    throw createError({
      statusCode: 400,
      message: 'Visi kandidat wajib diisi.',
    })
  }

  // 4. Validate mission
  const mission = typeof body.mission === 'string' ? body.mission.trim() : ''
  if (!mission) {
    throw createError({
      statusCode: 400,
      message: 'Misi kandidat wajib diisi.',
    })
  }

  // 5. Validate photoUrl (optional, nullable)
  let photoUrl: string | null = null
  if (body.photoUrl !== undefined && body.photoUrl !== null) {
    const trimmedUrl = String(body.photoUrl).trim()
    if (trimmedUrl.length > 0) {
      photoUrl = trimmedUrl
    }
  }

  // 6. Check number uniqueness within this election
  const candidatesColl = db.collection('elections').doc(electionId).collection('candidates')
  const duplicateCheck = await candidatesColl.where('number', '==', body.number).limit(1).get()

  if (!duplicateCheck.empty) {
    throw createError({
      statusCode: 409,
      message: `Nomor urut ${body.number} sudah digunakan oleh kandidat lain dalam pemilihan ini.`,
    })
  }

  // 7. Save candidate document
  const candidateRef = candidatesColl.doc()
  const candidateDocData = {
    electionId,
    number: body.number,
    name,
    photoUrl,
    vision,
    mission,
    createdAt: FieldValue.serverTimestamp(),
  }

  await candidateRef.set(candidateDocData)

  const savedDoc = await candidateRef.get()

  setResponseStatus(event, 201)

  return {
    candidate: formatCandidateDoc(savedDoc),
  }
})
