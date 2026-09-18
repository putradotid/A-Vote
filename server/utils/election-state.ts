/**
 * Server-side re-export and helpers for Election State
 * Source of truth: app/utils/election-state.ts
 */

import {
  computeElectionState,
  isElectionActive,
  areResultsPublished,
  validateElectionTimestamps,
} from '../../app/utils/election-state'

export {
  computeElectionState,
  isElectionActive,
  areResultsPublished,
  validateElectionTimestamps,
}

import type { Timestamp } from 'firebase-admin/firestore'
import type { ElectionAdminStatus, ElectionState } from '~/types'

/**
 * Helper to serialize Firestore document to JSON-safe ElectionListItem
 */
export function formatElectionDoc(doc: FirebaseFirestore.DocumentSnapshot): {
  id: string
  title: string
  description: string
  startAt: string | null
  endAt: string | null
  resultPublishedAt: string | null
  status: ElectionAdminStatus
  computedState: ElectionState
  createdBy: string
  createdAt: string
} {
  const data = doc.data() || {}
  const status = (data.status as ElectionAdminStatus) || 'DRAFT'
  
  const startAtDate = data.startAt ? (data.startAt as Timestamp).toDate() : null
  const endAtDate = data.endAt ? (data.endAt as Timestamp).toDate() : null
  const resultPubDate = data.resultPublishedAt ? (data.resultPublishedAt as Timestamp).toDate() : null
  const createdAtDate = data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date()

  const now = new Date()
  const computedState = computeElectionState(
    {
      status,
      startAt: startAtDate,
      endAt: endAtDate,
      resultPublishedAt: resultPubDate,
    },
    now,
  )

  return {
    id: doc.id,
    title: data.title || '',
    description: data.description || '',
    startAt: startAtDate ? startAtDate.toISOString() : null,
    endAt: endAtDate ? endAtDate.toISOString() : null,
    resultPublishedAt: resultPubDate ? resultPubDate.toISOString() : null,
    status,
    computedState,
    createdBy: data.createdBy || '',
    createdAt: createdAtDate.toISOString(),
  }
}
