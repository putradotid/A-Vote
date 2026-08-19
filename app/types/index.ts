/**
 * A-Vote — Shared Domain Types
 *
 * All domain interfaces are defined here and imported across the application.
 * Source of truth: .agent/schema.md
 *
 * Do NOT use `any`. Do NOT add fields not defined in schema.md.
 */

import type { Timestamp } from 'firebase/firestore'

// ─── User ────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'voter'

export interface User {
  /** Firebase Authentication UID. Also the Firestore document ID. */
  uid: string
  role: UserRole
  /** Student NIM. Null for admin accounts. */
  nim: string | null
  name: string
  /** SHA-256 hash of date of birth (YYYY-MM-DD). Null for admin accounts. Never plaintext. */
  dateOfBirthHash: string | null
  createdAt: Timestamp
}

// ─── Election ────────────────────────────────────────────────────────────────

/**
 * Administrative status stored in Firestore.
 * All other election states are COMPUTED from timestamps — never stored.
 */
export type ElectionAdminStatus = 'DRAFT' | 'CANCELLED'

/**
 * Computed election state. Derived by the server from timestamps.
 * Clients receive this value from the server — never compute it themselves.
 *
 * Computation logic (server time):
 *   DRAFT            if status == 'DRAFT'
 *   CANCELLED        if status == 'CANCELLED'
 *   SCHEDULED        if now < startAt
 *   ACTIVE           if startAt <= now < endAt
 *   ENDED            if endAt <= now < resultPublishedAt
 *   RESULT_PUBLISHED if now >= resultPublishedAt
 */
export type ElectionState =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'ENDED'
  | 'RESULT_PUBLISHED'
  | 'CANCELLED'

export interface Election {
  id: string
  title: string
  description: string
  /** When voting opens. Null while in DRAFT state. */
  startAt: Timestamp | null
  /** When voting closes. Null while in DRAFT state. Must be > startAt. */
  endAt: Timestamp | null
  /** When results become visible to voters. Null while in DRAFT. Must be >= endAt. */
  resultPublishedAt: Timestamp | null
  /** Only DRAFT and CANCELLED are stored. Other states are computed. */
  status: ElectionAdminStatus
  /** UID of the admin who created this election. */
  createdBy: string
  createdAt: Timestamp
}

// ─── Candidate ───────────────────────────────────────────────────────────────

/**
 * Firestore path: elections/{electionId}/candidates/{candidateId}
 */
export interface Candidate {
  id: string
  /** Denormalized parent election ID. */
  electionId: string
  /** Candidate pair number (paslon number). Unique within election. */
  number: number
  name: string
  /** Firebase Storage URL. Null if no photo uploaded. */
  photoUrl: string | null
  vision: string
  mission: string
  createdAt: Timestamp
}

// ─── Voter ───────────────────────────────────────────────────────────────────

/**
 * Represents election eligibility for a specific (userId, electionId) pair.
 * Document ID is deterministic: derived from electionId and userId.
 * A user may have multiple voter records across different elections.
 *
 * role == 'voter' on a User does NOT grant election-specific voting eligibility.
 * Eligibility is determined solely by the presence of a voters record.
 */
export interface Voter {
  /** Deterministic ID derived from electionId + userId. */
  id: string
  electionId: string
  /** Firebase Auth UID of the eligible voter. */
  userId: string
  /** Set to true only by the server-side vote transaction. */
  hasVoted: boolean
  createdAt: Timestamp
}

// ─── Ballot ──────────────────────────────────────────────────────────────────

/**
 * Stores a cast ballot. Contains NO direct voter identity.
 * Written ONLY by the Nuxt Server API via Firebase Admin SDK.
 * Immutable after creation. Clients must never read raw ballots.
 */
export interface Ballot {
  /** Random opaque document ID. Does NOT encode voter identity. */
  id: string
  electionId: string
  candidateId: string
  createdAt: Timestamp
}

// ─── Result Aggregate ────────────────────────────────────────────────────────

/**
 * Returned by GET /api/results/[electionId].
 * NOT a Firestore collection — computed server-side.
 */
export interface CandidateResult {
  candidateId: string
  candidateName: string
  candidateNumber: number
  photoUrl: string | null
  voteCount: number
  /** voteCount / totalVotes. 0 if totalVotes == 0. */
  percentage: number
}

export interface ElectionResult {
  electionId: string
  electionTitle: string
  computedState: ElectionState
  results: CandidateResult[]
  totalVotes: number
  totalEligibleVoters: number
  /** totalVotes / totalEligibleVoters (0–1). 0 if totalEligibleVoters == 0. */
  participationRate: number
}

// ─── API Request/Response shapes ─────────────────────────────────────────────

export interface StudentLoginRequest {
  nim: string
  /** Plain date of birth — YYYY-MM-DD. Hashed server-side, never stored. */
  dateOfBirth: string
}

export interface StudentLoginResponse {
  customToken: string
}

export interface VoteRequest {
  electionId: string
  candidateId: string
}

export interface VoteResponse {
  success: true
}

// ─── API Error shape ─────────────────────────────────────────────────────────

export interface ApiError {
  statusCode: number
  message: string
}
