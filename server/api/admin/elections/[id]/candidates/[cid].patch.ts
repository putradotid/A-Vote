import { requireAdmin } from '../../../../../utils/verify-token'
import { useAdminDb } from '../../../../../utils/firebase-admin'
import { formatElectionDoc } from '../../../../../utils/election-state'
import { formatCandidateDoc } from '../../../../../utils/candidate-helpers'
import type { UpdateCandidateRequest, CandidateDetailResponse } from '~/types'

export default defineEventHandler(async (event): Promise<CandidateDetailResponse & { success: boolean }> => {
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

  const formattedElection = formatElectionDoc(electionDoc)
  const currentState = formattedElection.computedState

  if (currentState !== 'DRAFT' && currentState !== 'SCHEDULED') {
    throw createError({
      statusCode: 400,
      message: `Kandidat hanya dapat diubah saat pemilihan berstatus DRAFT atau SCHEDULED. Status saat ini: ${currentState}`,
    })
  }

  const candidateRef = db.collection('elections').doc(electionId).collection('candidates').doc(candidateId)
  const candidateDoc = await candidateRef.get()

  if (!candidateDoc.exists) {
    throw createError({
      statusCode: 404,
      message: 'Kandidat tidak ditemukan.',
    })
  }

  const currentData = candidateDoc.data() || {}
  const body = await readBody<UpdateCandidateRequest>(event)

  if (!body || Object.keys(body).length === 0) {
    return {
      success: true,
      candidate: formatCandidateDoc(candidateDoc),
    }
  }

  const updatePayload: Record<string, unknown> = {}

  // 1. Validate number if provided
  if (body.number !== undefined) {
    if (body.number === null || typeof body.number !== 'number' || !Number.isInteger(body.number) || body.number < 1) {
      throw createError({
        statusCode: 400,
        message: 'Nomor urut paslon wajib berupa bilangan bulat positif (>= 1).',
      })
    }

    if (body.number !== currentData.number) {
      const candidatesColl = db.collection('elections').doc(electionId).collection('candidates')
      const duplicateSnap = await candidatesColl.where('number', '==', body.number).get()

      const conflict = duplicateSnap.docs.some((doc) => doc.id !== candidateId)
      if (conflict) {
        throw createError({
          statusCode: 409,
          message: `Nomor urut ${body.number} sudah digunakan oleh kandidat lain dalam pemilihan ini.`,
        })
      }
      updatePayload.number = body.number
    }
  }

  // 2. Validate name if provided
  if (body.name !== undefined) {
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name || name.length < 2 || name.length > 150) {
      throw createError({
        statusCode: 400,
        message: 'Nama kandidat wajib diisi (antara 2 sampai 150 karakter).',
      })
    }
    updatePayload.name = name
  }

  // 3. Validate vision if provided
  if (body.vision !== undefined) {
    const vision = typeof body.vision === 'string' ? body.vision.trim() : ''
    if (!vision) {
      throw createError({
        statusCode: 400,
        message: 'Visi kandidat wajib diisi.',
      })
    }
    updatePayload.vision = vision
  }

  // 4. Validate mission if provided
  if (body.mission !== undefined) {
    const mission = typeof body.mission === 'string' ? body.mission.trim() : ''
    if (!mission) {
      throw createError({
        statusCode: 400,
        message: 'Misi kandidat wajib diisi.',
      })
    }
    updatePayload.mission = mission
  }

  // 5. Validate photoUrl if provided
  if (body.photoUrl !== undefined) {
    if (body.photoUrl === null) {
      updatePayload.photoUrl = null
    } else {
      const trimmedUrl = String(body.photoUrl).trim()
      updatePayload.photoUrl = trimmedUrl.length > 0 ? trimmedUrl : null
    }
  }

  if (Object.keys(updatePayload).length > 0) {
    await candidateRef.update(updatePayload)
  }

  const updatedDoc = await candidateRef.get()

  return {
    success: true,
    candidate: formatCandidateDoc(updatedDoc),
  }
})
