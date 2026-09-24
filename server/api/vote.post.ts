import { requireVoter } from '../utils/verify-token'
import { useAdminDb } from '../utils/firebase-admin'
import { formatElectionDoc } from '../utils/election-state'
import { FieldValue } from 'firebase-admin/firestore'
import type { VoteRequest, VoteResponse } from '~/types'

export default defineEventHandler(async (event): Promise<VoteResponse> => {
  // 1. Authenticate and authorize: must be a logged-in voter
  const decodedToken = await requireVoter(event)
  const userId = decodedToken.uid

  // 2. Validate request body
  const body = await readBody<VoteRequest>(event)

  if (!body) {
    throw createError({
      statusCode: 400,
      message: 'Data suara wajib dikirimkan.',
    })
  }

  const electionId = typeof body.electionId === 'string' ? body.electionId.trim() : ''
  const candidateId = typeof body.candidateId === 'string' ? body.candidateId.trim() : ''

  if (!electionId) {
    throw createError({
      statusCode: 400,
      message: 'ID pemilihan wajib diisi.',
    })
  }

  if (!candidateId) {
    throw createError({
      statusCode: 400,
      message: 'ID kandidat wajib dipilih.',
    })
  }

  const db = useAdminDb()

  // 3. Execute atomic transaction
  try {
    await db.runTransaction(async (transaction) => {
      // 3a. Read voter eligibility: voters/{electionId}_{userId}
      const voterDocId = `${electionId}_${userId}`
      const voterRef = db.collection('voters').doc(voterDocId)
      const voterDoc = await transaction.get(voterRef)

      if (!voterDoc.exists) {
        throw createError({
          statusCode: 403,
          message: 'Anda tidak terdaftar sebagai pemilih pada pemilihan ini.',
        })
      }

      const voterData = voterDoc.data() || {}
      if (voterData.hasVoted === true) {
        throw createError({
          statusCode: 409,
          message: 'Anda sudah menggunakan hak suara pada pemilihan ini (sudah memilih).',
        })
      }

      // 3b. Read election document and verify computed state is ACTIVE
      const electionRef = db.collection('elections').doc(electionId)
      const electionDoc = await transaction.get(electionRef)

      if (!electionDoc.exists) {
        throw createError({
          statusCode: 404,
          message: 'Pemilihan tidak ditemukan.',
        })
      }

      const formattedElection = formatElectionDoc(electionDoc)
      if (formattedElection.computedState !== 'ACTIVE') {
        throw createError({
          statusCode: 400,
          message: `Pemilihan saat ini tidak aktif (status: ${formattedElection.computedState}). Suara hanya dapat diberikan saat status ACTIVE.`,
        })
      }

      // 3c. Read and verify candidate belongs to this election
      const candidateRef = db
        .collection('elections')
        .doc(electionId)
        .collection('candidates')
        .doc(candidateId)
      const candidateDoc = await transaction.get(candidateRef)

      if (!candidateDoc.exists) {
        throw createError({
          statusCode: 404,
          message: 'Kandidat tidak valid atau bukan kandidat dari pemilihan ini.',
        })
      }

      // 3d. Writes: Create ballot (opaque ID, NO voter identity) and set hasVoted = true
      const ballotRef = db.collection('ballots').doc()
      transaction.set(ballotRef, {
        electionId,
        candidateId,
        createdAt: FieldValue.serverTimestamp(),
      })

      transaction.update(voterRef, {
        hasVoted: true,
      })
    })

    setResponseStatus(event, 200)
    return {
      success: true,
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    const message = error instanceof Error ? error.message : 'Gagal memproses pemberian suara.'
    throw createError({
      statusCode: 500,
      message,
    })
  }
})
