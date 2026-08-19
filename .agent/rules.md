# Development Rules

## General

1. Use TypeScript. Do not use `any` unless absolutely necessary with justification.
2. Follow the established project structure as defined in architecture.md.
3. Prefer reusable components. Do not duplicate UI logic.
4. Do not duplicate business logic. Shared logic belongs in composables or utils.
5. All domain types must be defined in `types/index.ts`.

---

## Nuxt

1. Use Composition API only. Use `<script setup lang="ts">`.
2. Use composables for all reusable logic. Pages must remain thin.
3. Do not place business logic inside page components.
4. Layouts must be declared using `definePageMeta({ layout: '...' })`.
5. Route guards are implemented as Nuxt middleware.
6. The `auth.global.ts` middleware applies to all routes.
7. Role-specific middleware (`admin.ts`, `voter.ts`) is applied per-page
   using `definePageMeta({ middleware: ['admin'] })`.

---

## Firebase (Client)

1. Never initialize Firebase Admin SDK on the client.
2. Never expose Firebase Admin credentials (service account key, etc.) to client code.
3. The Firebase client SDK is initialized only in `plugins/firebase.client.ts`.
4. Firestore Security Rules are mandatory and must match server-side logic.
5. Do not rely on client-side Firebase SDK for security-sensitive operations.
6. The following Firebase client operations are permitted from the client:
   - Read permitted election and candidate data (subject to Security Rules).
   - Read own voter status (subject to Security Rules).
   - Firebase Authentication session management (sign in with custom token,
     sign out, get ID token).
7. The following operations are FORBIDDEN from the client:
   - Write to `ballots`.
   - Read from `ballots`.
   - Write to `voters` (any field, including `hasVoted`).
   - Write election status transitions.
   - Write voter eligibility records.

---

## Firebase (Server / Admin SDK)

1. The Firebase Admin SDK singleton is initialized in `server/utils/firebase-admin.ts`.
2. All server API routes that perform privileged operations must call
   `verifyToken()` from `server/utils/verify-token.ts` as the first step.
3. The verified `uid` from the token must be used for all downstream operations.
   Never trust a `uid` provided by the client in the request body.
4. Role must be verified from Firestore or verified custom claims — never from
   a client-provided field.

---

## Authentication

1. Student (voter) authentication uses NIM + Date of Birth.
2. Date of Birth must NEVER be stored in plaintext.
   Store only: `SHA-256(dateOfBirth)` where dateOfBirth format is `YYYY-MM-DD`.
3. Student authentication is handled exclusively by `POST /api/auth/student`.
4. Admin authentication uses Firebase email/password directly.
5. Custom tokens for students are generated only by the server using Admin SDK.
6. The client signs in using `signInWithCustomToken(auth, token)`.
7. The client must never receive or store raw NIM verification logic or
   the dateOfBirthHash from Firestore.

Notes:
- The student authentication endpoint must implement rate limiting.
- Authentication failures must use generic error messages and must not reveal
  whether a NIM exists.

---

## Voting

1. A voter may cast exactly one ballot per election (scoped per election).
2. A voter participating in election A being `hasVoted = true` does NOT prevent
   them from voting in election B.
3. Voting is permitted only during the ACTIVE state. ACTIVE is determined by
   server time: `startAt <= now < endAt`.
4. Vote submission must go through `POST /api/vote` (Nuxt Server API).
5. The server API performs ALL of the following checks atomically:
   a. Verify Firebase ID Token → get uid.
   b. Verify authenticated user has the voter application role.
   c. Verify voter record exists for (uid, electionId).
   d. Verify voters.hasVoted == false.
   e. Verify election is not CANCELLED.
   f. Verify election state is ACTIVE (using server time).
   g. Verify candidateId belongs to electionId.
   h. Write ballot with random ID (no voter identity).
   i. Set voters.hasVoted = true.
   All steps are wrapped in a single Firestore transaction.
6. A submitted ballot cannot be modified or deleted by any party.
7. Client-side voting checks are UX only and must never be the security boundary.
8. Users cannot vote in elections where they are not in the voters collection.

---

## Election Lifecycle

1. Election state is computed from timestamps using server time.
2. Only `DRAFT` and `CANCELLED` are stored as `status` in Firestore.
3. Do not store computed states (SCHEDULED, ACTIVE, ENDED, RESULT_PUBLISHED)
   in Firestore.
4. Clients receive computed election state from the server, not raw timestamps
   to compute themselves.
5. Invalid state transitions must be rejected server-side. See architecture.md
   for the valid transition table.
6. No server-side cron job or Cloud Function is required; state is computed
   on-demand from timestamps.

---

## Results

1. The `ballots` collection must NEVER be read by the client directly.
2. Firestore Security Rules must deny all client reads on `ballots`.
3. Result data is served only through `GET /api/results/[electionId]`.
4. The server verifies the requester's role and election state before returning
   any result data.
5. Voter-facing results are only accessible when election state is RESULT_PUBLISHED
   (i.e., server time >= resultPublishedAt).
6. Admin may access result aggregates at any time for administrative purposes.
7. The server returns aggregate data only (see schema.md ElectionResult interface).
   Raw ballot documents are never exposed.
8. Result publication is automatic. No manual admin action is required to
   publish results; the system uses `resultPublishedAt` timestamp.

---

## Security

1. Never store passwords manually. Use Firebase Authentication.
2. Never expose Firebase Admin SDK credentials. Use environment variables.
3. Never use client-side role checks as the only security mechanism.
4. Never trust client-provided: role, userId, hasVoted, election status,
   or authorization state.
5. All privileged server operations must verify the Firebase ID Token.
6. Firestore Security Rules must enforce the same access boundaries as
   the server API. Rules are a required second layer, not a replacement.
7. Ballot documents are append-only. No role may update or delete a ballot.
8. Race conditions on vote submission are prevented by the atomic Firestore
   transaction.

---

## Firestore Security Rules Requirements (Summary)

These rules must be implemented in `firestore.rules`:

| Collection | Read | Write |
|---|---|---|
| `users` | Own record only (voter); all records (admin) | Server only (Admin SDK) |
| `elections` | Authenticated users may read permitted election data | Server only (Admin SDK) |
| `elections/{id}/candidates` | All authenticated users | Server only (Admin SDK) |
| `voters` | Own records only (voter); all records (admin) | Server only (Admin SDK) |
| `ballots` | **DENIED for all clients** | **DENIED for all clients** (server only via Admin SDK) |

Admin SDK bypasses Security Rules by default (uses privileged access).
Security Rules therefore protect against direct client SDK abuse.