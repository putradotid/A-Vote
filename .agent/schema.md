# Database Schema

All collections are in Firestore. Document IDs are auto-generated unless
specified otherwise. All timestamps use Firestore ServerTimestamp.

Multi-tenancy (organizationId) is NOT implemented in V1.

---

## Collection: users

Stores identity and role for every account registered in the system.

| Field | Type | Description |
|---|---|---|
| `uid` | string | Firebase Authentication UID (document ID) |
| `role` | 'admin' \| 'voter' | User role. Determines access level. |
| `nim` | string \| null | Student NIM. Present only for role == 'voter'. |
| `name` | string | Full name of the user. |
| `dateOfBirthHash` | string \| null | SHA-256 hash of date of birth (format: YYYY-MM-DD). Present only for role == 'voter'. Never stored in plaintext. |
| `createdAt` | Timestamp | Account creation time (server timestamp). |

Notes:
- Admin users have `nim: null` and `dateOfBirthHash: null`.
- NIM must be unique across all voter accounts (enforced server-side).
- `uid` is the Firestore document ID, identical to the Firebase Auth UID.

---

## Collection: elections

Stores all elections. State is computed from timestamps; only DRAFT and
CANCELLED are stored as explicit status values.

| Field | Type | Description |
|---|---|---|
| `id` | string | Auto-generated document ID. |
| `title` | string | Election title. |
| `description` | string | Election description. |
| `startAt` | Timestamp \| null | When voting opens. Null in DRAFT state. |
| `endAt` | Timestamp \| null | When voting closes. Null in DRAFT state. |
| `resultPublishedAt` | Timestamp \| null | When results become visible to voters. Must be >= endAt. Null in DRAFT state. |
| `status` | 'DRAFT' \| 'CANCELLED' | Administrative status. Other states are computed. |
| `createdBy` | string | UID of the admin who created the election. |
| `createdAt` | Timestamp | Creation time (server timestamp). |

### Computed Election State

The effective election state is derived by the server using server time:

```
if status == 'DRAFT'      → DRAFT
if status == 'CANCELLED'  → CANCELLED
if now < startAt          → SCHEDULED
if startAt <= now < endAt → ACTIVE
if endAt <= now < resultPublishedAt → ENDED
if now >= resultPublishedAt         → RESULT_PUBLISHED
```

The computed state is never stored in Firestore. It is computed at query time
by the server. Clients receive the computed state from the server — not raw
timestamp fields to compute themselves.

### Valid Administrative Transitions

| From (computed) | Admin Action | Result |
|---|---|---|
| DRAFT | Set startAt, endAt, resultPublishedAt | → SCHEDULED |
| DRAFT | Cancel | → CANCELLED |
| SCHEDULED | Cancel | → CANCELLED |
| SCHEDULED | Clear dates | → DRAFT |
| ACTIVE | (none permitted) | — |
| ENDED | (none permitted) | — |
| RESULT_PUBLISHED | (none permitted) | — |
| CANCELLED | (none permitted) | — |

---

## Collection: candidates

Subcollection path: `elections/{electionId}/candidates/{candidateId}`

Candidates belong to a specific election.

| Field | Type | Description |
|---|---|---|
| `id` | string | Auto-generated document ID. |
| `electionId` | string | Parent election ID (denormalized for queries). |
| `number` | number | Candidate pair/paslon number. Must be unique within the election. |
| `name` | string | Candidate full name. |
| `photoUrl` | string \| null | Firebase Storage URL of candidate photo. |
| `vision` | string | Vision statement. |
| `mission` | string | Mission statement. |
| `createdAt` | Timestamp | Creation time (server timestamp). |

Notes:
- Candidates may only be added/edited/deleted when election is in DRAFT or
  SCHEDULED state.
- `number` uniqueness is enforced server-side.

---

## Collection: voters

Represents voter eligibility for a specific election. One document per
(userId, electionId) pair. A user may have multiple voter records across
different elections.

| Field | Type | Description |
|---|---|---|
| `id` | string | Auto-generated document ID. |
| `electionId` | string | The election this voter is registered for. |
| `userId` | string | The Firebase Auth UID of the eligible voter. |
| `hasVoted` | boolean | Whether this voter has already cast a ballot in this election. Default: false. |
| `createdAt` | Timestamp | When admin registered this voter (server timestamp). |

Notes:
- The combination of (electionId + userId) must be unique. Enforced server-side.
- `hasVoted` is set to true only by the server-side vote transaction.
- Clients may READ their own voter record.
- Clients must NEVER write to voters.

---

## Collection: ballots

Stores cast ballots. Contains NO voter identity. Voter privacy is maintained
by design.

| Field | Type | Description |
|---|---|---|
| `id` | string | Random auto-generated document ID (opaque). |
| `electionId` | string | The election this ballot belongs to. |
| `candidateId` | string | The candidate who received this vote. |
| `createdAt` | Timestamp | When the ballot was submitted (server timestamp). |

Notes:
- Ballots are written ONLY by the Nuxt Server API using Firebase Admin SDK.
- Ballots are IMMUTABLE. No update or delete is permitted for any role.
- The ballot ID is random and opaque. It does NOT encode voter identity.
- There is no stored link between a ballot and the voter who cast it.
- The `voters.hasVoted` flag and this ballot are written atomically in the
  same Firestore transaction.
- Clients must NEVER read raw ballot documents.
- Result aggregation is performed server-side.

---

## API: Result Aggregate Response Shape

Returned by `GET /api/results/[electionId]`. Not a Firestore collection.

```typescript
interface ElectionResult {
  electionId: string
  electionTitle: string
  computedState: ElectionState
  results: CandidateResult[]
  totalVotes: number
  totalEligibleVoters: number
  participationRate: number  // totalVotes / totalEligibleVoters (0–1)
}

interface CandidateResult {
  candidateId: string
  candidateName: string
  candidateNumber: number
  photoUrl: string | null
  voteCount: number
  percentage: number  // voteCount / totalVotes (0–1), 0 if totalVotes == 0
}
```

---

## TypeScript Types (Shared)

```typescript
type UserRole = 'admin' | 'voter'

type ElectionState =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'ENDED'
  | 'RESULT_PUBLISHED'
  | 'CANCELLED'

type ElectionAdminStatus = 'DRAFT' | 'CANCELLED'

interface User {
  uid: string
  role: UserRole
  nim: string | null
  name: string
  dateOfBirthHash: string | null
  createdAt: Timestamp
}

interface Election {
  id: string
  title: string
  description: string
  startAt: Timestamp | null
  endAt: Timestamp | null
  resultPublishedAt: Timestamp | null
  status: ElectionAdminStatus
  createdBy: string
  createdAt: Timestamp
}

interface Candidate {
  id: string
  electionId: string
  number: number
  name: string
  photoUrl: string | null
  vision: string
  mission: string
  createdAt: Timestamp
}

interface Voter {
  id: string
  electionId: string
  userId: string
  hasVoted: boolean
  createdAt: Timestamp
}

interface Ballot {
  id: string
  electionId: string
  candidateId: string
  createdAt: Timestamp
}
```