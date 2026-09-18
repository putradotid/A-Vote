import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { requireAdmin } from '../../../utils/verify-token'
import { useAdminDb } from '../../../utils/firebase-admin'
import { formatElectionDoc, validateElectionTimestamps } from '../../../utils/election-state'
import type { CreateElectionRequest, ElectionDetailResponse } from '~/types'

export default defineEventHandler(async (event): Promise<ElectionDetailResponse> => {
  const decodedToken = await requireAdmin(event)

  const body = await readBody<CreateElectionRequest>(event)

  const title = (body?.title || '').trim()
  const description = (body?.description || '').trim()

  if (!title || title.length < 3 || title.length > 150) {
    throw createError({
      statusCode: 400,
      message: 'Judul pemilihan harus diisi antara 3 sampai 150 karakter.',
    })
  }

  if (!description || description.length < 3 || description.length > 2000) {
    throw createError({
      statusCode: 400,
      message: 'Deskripsi pemilihan harus diisi antara 3 sampai 2000 karakter.',
    })
  }

  let startAtTimestamp: Timestamp | null = null
  let endAtTimestamp: Timestamp | null = null
  let resultPublishedAtTimestamp: Timestamp | null = null

  const hasStartAt = body?.startAt !== undefined && body.startAt !== null && body.startAt !== ''
  const hasEndAt = body?.endAt !== undefined && body.endAt !== null && body.endAt !== ''
  const hasResultPub = body?.resultPublishedAt !== undefined && body.resultPublishedAt !== null && body.resultPublishedAt !== ''

  const anyTimestampProvided = hasStartAt || hasEndAt || hasResultPub
  const allTimestampsProvided = hasStartAt && hasEndAt && hasResultPub

  if (anyTimestampProvided) {
    if (!allTimestampsProvided) {
      throw createError({
        statusCode: 400,
        message: 'Jadwal pemilihan harus lengkap (startAt, endAt, dan resultPublishedAt).',
      })
    }

    const startAt = new Date(body.startAt!)
    const endAt = new Date(body.endAt!)
    const resultPub = new Date(body.resultPublishedAt!)

    if (isNaN(startAt.getTime()) || isNaN(endAt.getTime()) || isNaN(resultPub.getTime())) {
      throw createError({
        statusCode: 400,
        message: 'Format tanggal tidak valid.',
      })
    }

    const now = new Date()
    const validation = validateElectionTimestamps(startAt, endAt, resultPub, now)
    if (!validation.valid) {
      throw createError({
        statusCode: 400,
        message: validation.reason,
      })
    }

    startAtTimestamp = Timestamp.fromDate(startAt)
    endAtTimestamp = Timestamp.fromDate(endAt)
    resultPublishedAtTimestamp = Timestamp.fromDate(resultPub)
  }

  const db = useAdminDb()
  const electionData = {
    title,
    description,
    startAt: startAtTimestamp,
    endAt: endAtTimestamp,
    resultPublishedAt: resultPublishedAtTimestamp,
    status: 'DRAFT',
    createdBy: decodedToken.uid,
    createdAt: FieldValue.serverTimestamp(),
  }

  const docRef = await db.collection('elections').add(electionData)
  const savedDoc = await docRef.get()

  return {
    election: formatElectionDoc(savedDoc),
  }
})
