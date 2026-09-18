import { Timestamp } from 'firebase-admin/firestore'
import { requireAdmin } from '../../../../utils/verify-token'
import { useAdminDb } from '../../../../utils/firebase-admin'
import { formatElectionDoc, validateElectionTimestamps } from '../../../../utils/election-state'
import type { UpdateElectionRequest } from '~/types'

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

  if (currentState === 'CANCELLED') {
    throw createError({
      statusCode: 400,
      message: 'Pemilihan yang telah dibatalkan tidak dapat diubah.',
    })
  }

  const body = await readBody<UpdateElectionRequest>(event)
  const updatePayload: Record<string, unknown> = {}

  // 1. Title
  if (body.title !== undefined) {
    const title = body.title.trim()
    if (title.length < 3 || title.length > 150) {
      throw createError({
        statusCode: 400,
        message: 'Judul pemilihan harus antara 3 sampai 150 karakter.',
      })
    }
    updatePayload.title = title
  }

  // 2. Description
  if (body.description !== undefined) {
    const description = body.description.trim()
    if (description.length < 3 || description.length > 2000) {
      throw createError({
        statusCode: 400,
        message: 'Deskripsi pemilihan harus antara 3 sampai 2000 karakter.',
      })
    }
    updatePayload.description = description
  }

  // 3. Status transition
  if (body.status !== undefined) {
    if (body.status === 'CANCELLED') {
      if (currentState !== 'DRAFT' && currentState !== 'SCHEDULED') {
        throw createError({
          statusCode: 400,
          message: 'Hanya pemilihan berstatus DRAFT atau SCHEDULED yang dapat dibatalkan.',
        })
      }
      updatePayload.status = 'CANCELLED'
    } else if (body.status === 'DRAFT') {
      if (currentState !== 'SCHEDULED') {
        throw createError({
          statusCode: 400,
          message: 'Hanya pemilihan terjadwal yang dapat dikembalikan ke DRAFT.',
        })
      }
      updatePayload.status = 'DRAFT'
      updatePayload.startAt = null
      updatePayload.endAt = null
      updatePayload.resultPublishedAt = null
    }
  }

  // 4. Timestamps
  const hasTimestamps = body.startAt !== undefined || body.endAt !== undefined || body.resultPublishedAt !== undefined
  if (hasTimestamps) {
    if (currentState === 'RESULT_PUBLISHED') {
      throw createError({
        statusCode: 400,
        message: 'Jadwal tidak dapat diubah setelah hasil pemilihan dipublikasikan.',
      })
    }

    if (currentState === 'ACTIVE' || currentState === 'ENDED') {
      // PRD: startAt & endAt locked, but resultPublishedAt can be modified before results are published
      if (body.startAt !== undefined || body.endAt !== undefined) {
        throw createError({
          statusCode: 400,
          message: 'Waktu mulai dan selesai voting (startAt/endAt) tidak dapat diubah setelah pemilihan aktif atau selesai.',
        })
      }

      if (body.resultPublishedAt !== undefined) {
        if (!body.resultPublishedAt) {
          throw createError({
            statusCode: 400,
            message: 'Waktu pengumuman hasil (resultPublishedAt) tidak boleh dikosongkan.',
          })
        }

        const newPubDate = new Date(body.resultPublishedAt)
        if (isNaN(newPubDate.getTime())) {
          throw createError({
            statusCode: 400,
            message: 'Format tanggal tidak valid.',
          })
        }

        const data = doc.data() || {}
        const endAtDate = data.endAt ? (data.endAt as Timestamp).toDate() : null
        if (endAtDate && newPubDate < endAtDate) {
          throw createError({
            statusCode: 400,
            message: 'Waktu pengumuman hasil (resultPublishedAt) harus sama atau setelah waktu selesai (endAt).',
          })
        }

        updatePayload.resultPublishedAt = Timestamp.fromDate(newPubDate)
      }
    } else {
      // currentState === 'DRAFT' || currentState === 'SCHEDULED'
      // Check if clearing all timestamps back to DRAFT
      if (body.startAt === null && body.endAt === null && body.resultPublishedAt === null) {
        updatePayload.startAt = null
        updatePayload.endAt = null
        updatePayload.resultPublishedAt = null
        updatePayload.status = 'DRAFT'
      } else {
        // Scheduling or updating timestamps: all 3 fields required
        const hasStartAt = body.startAt !== undefined && body.startAt !== null && body.startAt !== ''
        const hasEndAt = body.endAt !== undefined && body.endAt !== null && body.endAt !== ''
        const hasResultPub = body.resultPublishedAt !== undefined && body.resultPublishedAt !== null && body.resultPublishedAt !== ''

        if (!hasStartAt || !hasEndAt || !hasResultPub) {
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

        updatePayload.startAt = Timestamp.fromDate(startAt)
        updatePayload.endAt = Timestamp.fromDate(endAt)
        updatePayload.resultPublishedAt = Timestamp.fromDate(resultPub)
        updatePayload.status = 'DRAFT'
      }
    }
  }

  if (Object.keys(updatePayload).length > 0) {
    await docRef.update(updatePayload)
  }

  const updatedDoc = await docRef.get()
  return {
    success: true,
    election: formatElectionDoc(updatedDoc),
  }
})
