/**
 * Election State Utility
 *
 * Computes the effective election state from stored Firestore fields.
 * Source of truth: .agent/architecture.md § Election Lifecycle
 *
 * IMPORTANT: On the server, pass `new Date()` as `now`.
 * On the client, this utility must only be called with a server-provided
 * timestamp — clients must NOT compute state independently for security decisions.
 */

import type { ElectionAdminStatus, ElectionState } from '~/types'

interface ElectionTimestamps {
  status: ElectionAdminStatus
  startAt: Date | null
  endAt: Date | null
  resultPublishedAt: Date | null
}

/**
 * Compute the effective election state using the provided reference time.
 *
 * Logic (evaluated in order):
 *   1. DRAFT            if status == 'DRAFT'
 *   2. CANCELLED        if status == 'CANCELLED'
 *   3. SCHEDULED        if now < startAt
 *   4. ACTIVE           if startAt <= now < endAt
 *   5. ENDED            if endAt <= now < resultPublishedAt
 *   6. RESULT_PUBLISHED if now >= resultPublishedAt
 */
export function computeElectionState(
  election: ElectionTimestamps,
  now: Date,
): ElectionState {
  if (election.status === 'DRAFT') return 'DRAFT'
  if (election.status === 'CANCELLED') return 'CANCELLED'

  // All remaining branches require valid timestamps.
  // If an election is not DRAFT/CANCELLED, timestamps should always be set.
  // Guard against null in case of data inconsistency.
  if (!election.startAt || !election.endAt || !election.resultPublishedAt) {
    // Treat missing timestamps as DRAFT (safe fallback)
    return 'DRAFT'
  }

  if (now < election.startAt) return 'SCHEDULED'
  if (now >= election.startAt && now < election.endAt) return 'ACTIVE'
  if (now >= election.endAt && now < election.resultPublishedAt) return 'ENDED'
  return 'RESULT_PUBLISHED'
}

/**
 * Returns true if the election is currently in ACTIVE state.
 * Use server time on the server. Do not use for security decisions on the client.
 */
export function isElectionActive(election: ElectionTimestamps, now: Date): boolean {
  return computeElectionState(election, now) === 'ACTIVE'
}

/**
 * Returns true if results are publicly visible.
 * Use server time on the server. Do not use for security decisions on the client.
 */
export function areResultsPublished(election: ElectionTimestamps, now: Date): boolean {
  return computeElectionState(election, now) === 'RESULT_PUBLISHED'
}

/**
 * Validate that election timestamp constraints are satisfied.
 * Must pass before persisting election timestamps.
 * Constraint: startAt < endAt <= resultPublishedAt
 */
export function validateElectionTimestamps(
  startAt: Date,
  endAt: Date,
  resultPublishedAt: Date,
): { valid: true } | { valid: false; reason: string } {
  if (startAt >= endAt) {
    return { valid: false, reason: 'startAt must be before endAt' }
  }
  if (endAt > resultPublishedAt) {
    return { valid: false, reason: 'resultPublishedAt must be >= endAt' }
  }
  return { valid: true }
}
