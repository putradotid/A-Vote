# Product Requirements Document

## 1. Product Overview

Name:
A-Vote — E-Voting Platform

Purpose:
Provide a secure, web-based electronic voting platform for student organization
elections at Universitas Amikom Purwokerto.

Scope (V1):
Single-institution deployment. Multi-organization / multi-tenancy is out of scope.

---

## 2. Target Users

### Admin (Election Committee)
Responsible for managing elections, candidates, voter eligibility, and monitoring
results. Uses email-based authentication through the Firebase Authentication
platform.

### Voter (Student)
Participates in elections they are registered for. Authenticates using their
student identity credentials (NIM and Date of Birth). May participate in multiple elections, subject to per-election eligibility.
Voting eligibility and voting status are tracked independently for each election.

---

## 3. Core Features

### 3.1 Authentication

#### Student (Voter) Authentication
- Login using NIM (Nomor Induk Mahasiswa) and Date of Birth.
- Authentication is performed server-side through a Nuxt Server API endpoint.
- The server verifies credentials against stored and authorized student identity data.
- Student identity verification and election voting eligibility are separate concepts.
- A valid student identity does not automatically grant voting eligibility for an election.
- The server generates a Firebase Custom Token upon successful verification.
- The client signs into Firebase using the Custom Token.
- Date of Birth is NOT stored in plaintext. A one-way hash is used.
- Students do NOT use email/password authentication.

#### Admin Authentication
- Login using email and password via Firebase Authentication.
- Admin accounts are provisioned manually, not through self-registration.

#### Shared
- Logout invalidates the Firebase session.
- All pages enforce role-based access control.
- Client-provided role or authentication state must never be trusted
  as the security boundary.

---

### 3.2 Election Management

Admins can:
- Create a new election (enters DRAFT state).
- Set election title, description, start time, end time, and result publication time.
- Cancel an election (CANCELLED state — irreversible from UI).
- Promote a DRAFT election to SCHEDULED (by setting valid future startAt/endAt).
- Monitor the current computed lifecycle state of any election.

Election state is computed automatically from timestamps. Admins do not manually
advance most states; they manage the time values.

Election lifecycle states and their determination rules:

  DRAFT            — Created but not yet scheduled (admin-only control).
  SCHEDULED        — now < startAt (upcoming).
  ACTIVE           — startAt <= now < endAt (voting is open).
  ENDED            — endAt <= now < resultPublishedAt (voting closed, results pending).
  RESULT_PUBLISHED — now >= resultPublishedAt (results are publicly visible).
  CANCELLED        — Explicitly cancelled by admin (no voting allowed).

State transitions that must be prevented:
- Cannot activate a cancelled election.
- Cannot reduce resultPublishedAt to a time before endAt.
- Cannot modify startAt/endAt of an ACTIVE or closed election.
- startAt and endAt may be modified while the election is in DRAFT or SCHEDULED state.
- startAt and endAt cannot be modified once the election becomes ACTIVE.
- resultPublishedAt may be modified before results are published, but must always be greater than or equal to endAt.
- set election title, description, start time, end time, and required result publication time.

---

### 3.3 Candidate Management

Admins can:
- Add candidates to a specific election (CRUD).
- Assign a candidate number, name, photo, vision statement, and mission statement.
- Upload candidate photos to Firebase Storage.
- Edit or remove candidates while the election is in DRAFT or SCHEDULED state.
- Candidate modification is restricted once an election becomes ACTIVE.

---

### 3.4 Voter Management

- Voter registration is admin-managed. Students do NOT self-register for elections.
- Admins manage eligible voters for a specific election using authorized student identity data.
- The system associates the eligible student identity with the corresponding authenticated user account and election (electionId).
- A student may be registered as a voter in multiple elections.
- Each voter–election pair has an independent hasVoted flag.
- Bulk import (CSV) is out of scope for V1.

---

### 3.5 Voting

- A voter may cast exactly one ballot per election.
- Voting is only permitted during the ACTIVE state (server-verified timing).
- A voter must be registered for the election (present in the voters collection).
- The voter must not have already voted (voters.hasVoted must be false).
- The voter selects exactly one candidate.
- A confirmation step is required before submitting the ballot.
- Once submitted, the ballot cannot be modified or retracted.
- All voting constraints are enforced server-side through an atomic transaction.
- Client-side checks are UX only; they are never the security boundary.
- The ballot does NOT contain direct voter identity.
- Voter eligibility and voting status are stored separately from ballot data.
- Raw ballot data must not be exposed to voters or unauthorized clients.

---

### 3.6 Results

- Results are computed server-side by aggregating the ballots collection.
- The client does NOT receive raw ballot data.
- The server returns aggregate data only:
    - Per-candidate vote count
    - Total votes cast
    - Total eligible voters
    - Voter participation rate (turnout)

#### Voter result visibility:
- Voters CANNOT view results before resultPublishedAt.
- Results become automatically accessible to voters when now >= resultPublishedAt.
- No manual admin publish action is required.

#### Admin result visibility:
- Admins may view aggregated results for administrative purposes,
  subject to authorization rules (to be defined in architecture).

---

## 4. Non-Requirements (V1)

- Multi-organization / multi-tenancy.
- Voter self-registration.
- Bulk voter import (CSV).
- Email notifications.
- Real-time live vote counting for voters during active election.
- Mobile native application.
- Multiple ballot selections (ranked choice, etc.) — V1 is single-choice only.