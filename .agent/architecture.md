# Architecture

## Stack

- Nuxt 4 (TypeScript, SSR + Server API routes)
- Tailwind CSS
- Firebase Authentication (Custom Tokens for students; email/password for admin)
- Firebase Admin SDK (server-side only — never exposed to client)
- Firestore (database)
- Firebase Storage (candidate photo uploads)
- Vercel (deployment, Node.js runtime for server routes)

---

## Architecture Principles

1. UI must not access sensitive data or perform sensitive mutations directly.
2. All sensitive operations must pass through Nuxt Server API routes.
3. Server API routes verify Firebase ID Tokens before processing any request.
4. Role and permission checks must be performed server-side or in Firestore
   Security Rules — never trusted from client-provided state.
5. Business logic must not be placed in page components. Use composables.
6. Reusable logic belongs in composables. Composables coordinate with server APIs.
7. The Firebase Admin SDK is server-only. It must never be initialized client-side.
8. Firestore Security Rules are the last line of defense for all Firestore
   operations and must be treated as a required security layer, not optional.

---

## System Architecture Diagram

```
Browser (Client)
  │
  ├── Nuxt Pages / Components / Composables
  │       │
  │       ├── Direct Firestore reads (permitted non-sensitive data only)
  │       │       subject to Firestore Security Rules
  │       │
  │       └── HTTP requests → Nuxt Server API
  │
  └── Nuxt Server (Node.js on Vercel)
          │
          ├── Verify Firebase ID Token (firebase-admin)
          ├── Verify role and authorization
          │
          └── Firebase Admin SDK
                  ├── Firestore (privileged reads and writes)
                  │       ├── Atomic vote transaction
                  │       ├── Result aggregation
                  │       └── Administrative operations
                  ├── Firebase Authentication (custom token generation)
                  └── Firebase Storage (admin operations if needed)
```

---

## Authentication Architecture

### Student (Voter) Authentication

```
Browser
  │
  ├── POST /api/auth/student
  │       Body: { nim, dateOfBirth }
  │
  └── Nuxt Server API
          │
          ├── Look up user by NIM in Firestore (server-side)
          ├── Compare SHA-256(dateOfBirth) against stored dateOfBirthHash
          ├── Verify user role == 'voter'
          │
          └── Firebase Admin SDK
                  └── createCustomToken(uid, { role: 'voter' })
                          │
                          ▼
                  Return customToken to client
                          │
                          ▼
          Client: signInWithCustomToken(auth, customToken)
```

- Date of Birth is NEVER stored in plaintext.
- Date of Birth is stored as SHA-256(dateOfBirth) in the users collection.
- Date of Birth is NEVER returned to the client.
- The custom token embeds the role claim. Role must be re-verified server-side
  on every sensitive request (custom claim is signed by Firebase, but still
  re-verified via Admin SDK token verification).

### Admin Authentication

```
Browser
  │
  └── Firebase Authentication (client SDK)
          └── signInWithEmailAndPassword(email, password)
                  │
                  └── Firebase ID Token
```

Admin accounts are provisioned manually. Admin role is stored in Firestore
`users/{uid}.role` and may also be set as a Firebase Custom Claim for efficiency.

### Token Verification (all server requests)

Every Nuxt Server API route that performs a privileged operation must:

1. Extract the Authorization header: `Bearer <Firebase ID Token>`
2. Call `adminAuth.verifyIdToken(token)` to validate the token.
3. Use the verified `uid` — never the client-provided uid.
4. Look up the user's role from Firestore or verified custom claims.
5. Reject the request if the role does not satisfy the required permission.

---

## Client Access Boundaries

### Permitted (direct Firestore client reads, subject to Security Rules)

- `elections/{id}` — read election metadata (not raw status transitions)
- `elections/{id}/candidates` — read candidate list
- Own `voters` record — read own `hasVoted` status for a given election
- Publicly visible fields on `users/{uid}` (own record only)

### Forbidden (must go through Server API)

| Operation | Reason |
|---|---|
| Write to `ballots` | Vote integrity — server-only atomic transaction |
| Read from `ballots` | Voter privacy — server aggregates only |
| Modify `voters.hasVoted` | Vote integrity — set only within vote transaction |
| Modify `voters` eligibility | Authorization — admin-only server operation |
| Read result aggregate | Privacy + timing — server checks resultPublishedAt |
| Generate Firebase Custom Token | Security — server-only operation |
| Perform election status transitions | Authorization — server validates rules |

---

## Server API Routes

| Method | Route | Purpose | Auth Required |
|---|---|---|---|
| POST | `/api/auth/student` | Student login via NIM + DOB; returns custom token | None |
| POST | `/api/vote` | Submit ballot (atomic transaction) | Voter ID Token |
| GET | `/api/results/[electionId]` | Get aggregate results for an election | ID Token (voter: after resultPublishedAt; admin: always) |
| POST | `/api/admin/elections` | Create election | Admin ID Token |
| PATCH | `/api/admin/elections/[id]` | Update election (dates, status) | Admin ID Token |
| POST | `/api/admin/elections/[id]/voters` | Add voter to election | Admin ID Token |
| DELETE | `/api/admin/elections/[id]/voters/[vid]` | Remove voter from election | Admin ID Token |
| POST | `/api/admin/elections/[id]/candidates` | Add candidate | Admin ID Token |
| PATCH | `/api/admin/elections/[id]/candidates/[cid]` | Edit candidate | Admin ID Token |
| DELETE | `/api/admin/elections/[id]/candidates/[cid]` | Delete candidate | Admin ID Token |

---

## Election Lifecycle

Election state is computed from timestamps + administrative flags.

```
Computed state logic (using SERVER TIME):

  if status == 'DRAFT'      → DRAFT
  if status == 'CANCELLED'  → CANCELLED
  if now < startAt          → SCHEDULED
  if startAt <= now < endAt → ACTIVE
  if endAt <= now < resultPublishedAt → ENDED
  if now >= resultPublishedAt         → RESULT_PUBLISHED
```

`status` field in Firestore stores only: `DRAFT` or `CANCELLED`.
All other states are computed. This prevents manual state manipulation.

Valid administrative transitions:

| From | To | Condition |
|---|---|---|
| DRAFT | SCHEDULED | Set valid startAt, endAt, resultPublishedAt |
| DRAFT | CANCELLED | Admin explicit cancel |
| SCHEDULED | CANCELLED | Admin explicit cancel (before startAt) |
| SCHEDULED | DRAFT | Admin resets dates (sets them to null) |

Transitions that are prevented:
- ACTIVE → any manual state change (election is live)
- ENDED → any manual state change (election closed)
- RESULT_PUBLISHED → any manual state change
- CANCELLED → any other state

---

## Voting Transaction

```
Client
  │
  └── POST /api/vote
          Body: { electionId, candidateId }
          Header: Authorization: Bearer <Firebase ID Token>
          │
          └── Server (Nuxt API Route)
                  │
                  ├── 1. Verify ID Token → get uid (reject if invalid)
                  ├── 2. Verify user role == 'voter' (reject if not voter)
                  │
                  └── Firestore Transaction (Admin SDK)
                          │
                          ├── 3. Read voters record for (uid, electionId)
                          │       → reject if not found (not eligible)
                          ├── 4. Check hasVoted == false
                          │       → reject if already voted
                          ├── 5. Read election record
                          │       → reject if CANCELLED
                          ├── 6. Compute election state using server time
                          │       → reject if not ACTIVE
                          ├── 7. Verify candidateId belongs to this election
                          │       → reject if invalid
                          ├── 8. Create ballot document (random ID)
                          │       { electionId, candidateId, createdAt: serverTimestamp }
                          └── 9. Set voters.hasVoted = true
```

The transaction is atomic. If any step fails, no data is written.
The ballot document contains NO voter identity.

---

## Result Aggregation

```
Client
  │
  └── GET /api/results/[electionId]
          Header: Authorization: Bearer <Firebase ID Token>
          │
          └── Server (Nuxt API Route)
                  │
                  ├── 1. Verify ID Token → get uid and role
                  ├── 2. Read election record
                  ├── 3. If role == 'voter':
                  │       → compute election state using server time
                  │       → reject if state != RESULT_PUBLISHED
                  ├── 4. If role == 'admin':
                  │       → allow (admin may view results at any time)
                  │
                  └── Aggregate ballots by candidateId
                          │
                          └── Return:
                              {
                                electionId,
                                results: [
                                  { candidateId, candidateName, voteCount }
                                ],
                                totalVotes: number,
                                totalEligibleVoters: number,
                                participationRate: number
                              }
```

Raw ballot documents are NEVER returned to the client.

---

## Nuxt Project Structure

```
app/
├── app.vue                        # Root: NuxtLayout + NuxtPage
├── assets/css/main.css            # Tailwind directives + design tokens
├── components/
│   ├── ui/                        # Shared: Button, Card, Input, Modal, Badge, Spinner
│   ├── admin/                     # Admin-specific components
│   └── voter/                     # Voter-specific components
├── composables/
│   ├── useAuth.ts                 # Auth state, login, logout
│   ├── useElection.ts             # Election reads (client-safe data)
│   ├── useCandidates.ts           # Candidate reads
│   ├── useVoterStatus.ts          # Own voter status (hasVoted)
│   ├── useVoting.ts               # Vote submission (calls /api/vote)
│   └── useResults.ts              # Result fetch (calls /api/results/[id])
├── layouts/
│   ├── admin.vue                  # Sidebar + Header
│   ├── voter.vue                  # Header + Content
│   └── auth.vue                   # Centered login layout
├── middleware/
│   ├── auth.global.ts             # Redirect unauthenticated users to /login
│   ├── admin.ts                   # Require admin role
│   └── voter.ts                   # Require voter role
├── pages/
│   ├── index.vue                  # Root redirect by role
│   ├── login.vue                  # Student login (NIM + DOB)
│   ├── admin/
│   │   ├── login.vue              # Admin login (email + password)
│   │   ├── index.vue              # Dashboard
│   │   ├── elections/
│   │   │   ├── index.vue          # Election list
│   │   │   ├── create.vue         # Create election
│   │   │   └── [id]/
│   │   │       ├── index.vue      # Election detail + status
│   │   │       ├── candidates/
│   │   │       │   ├── index.vue  # Candidate list
│   │   │       │   ├── create.vue # Add candidate
│   │   │       │   └── [cid].vue  # Edit candidate
│   │   │       ├── voters/
│   │   │       │   └── index.vue  # Voter management
│   │   │       └── results/
│   │   │           └── index.vue  # Result view (admin)
│   └── election/
│       ├── index.vue              # Election info + status banner
│       ├── candidates.vue         # Browse candidates
│       ├── vote.vue               # Cast ballot
│       └── result.vue             # Result view (voter, after publication)
├── plugins/
│   └── firebase.client.ts         # Firebase client SDK init (client-only)
├── server/
│   ├── api/
│   │   ├── auth/student.post.ts   # Student auth endpoint
│   │   ├── vote.post.ts           # Vote submission endpoint
│   │   ├── results/[electionId].get.ts  # Result aggregation endpoint
│   │   └── admin/
│   │       ├── elections/
│   │       │   ├── index.post.ts
│   │       │   └── [id]/
│   │       │       ├── index.patch.ts
│   │       │       ├── voters/
│   │       │       │   ├── index.post.ts
│   │       │       │   └── [vid].delete.ts
│   │       │       └── candidates/
│   │       │           ├── index.post.ts
│   │       │           ├── [cid].patch.ts
│   │       │           └── [cid].delete.ts
│   └── utils/
│       ├── firebase-admin.ts      # Firebase Admin SDK singleton
│       └── verify-token.ts        # ID Token verification helper
├── types/
│   └── index.ts                   # All shared TypeScript interfaces
└── utils/
    └── election-state.ts          # Compute election state from timestamps

firestore.rules                    # Firestore Security Rules
storage.rules                      # Firebase Storage Security Rules
.env.example                       # Required environment variables (no secrets)
```

---

## Deployment

- Platform: Vercel (Node.js runtime — required for Nuxt server routes)
- Firebase Admin SDK credentials in Vercel environment variables (never committed)
- Firebase client config in public runtime config (intentionally public)
- Firestore Security Rules deployed via Firebase CLI