import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import crypto from 'node:crypto'

const projectRequire = createRequire('c:/laragon/www/A-Vote/package.json')
const { initializeApp, cert } = projectRequire('firebase-admin/app')
const { getAuth } = projectRequire('firebase-admin/auth')
const { getFirestore, Timestamp, FieldValue } = projectRequire('firebase-admin/firestore')

// Load .env
const envPath = path.resolve('c:/laragon/www/A-Vote/.env')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) {
    let val = match[2].trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    env[match[1].trim()] = val
  }
}

const privateKey = env.NUXT_FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
const adminApp = initializeApp({
  credential: cert({
    projectId: env.NUXT_FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: env.NUXT_FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey,
  }),
}, 'test-runner-phase6')

const auth = getAuth(adminApp)
const db = getFirestore(adminApp)
const API_KEY = env.NUXT_PUBLIC_FIREBASE_API_KEY
const BASE_URL = 'http://localhost:3000'

async function getFirebaseIdToken(uid) {
  const customToken = await auth.createCustomToken(uid)
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  })
  const data = await res.json()
  if (!data.idToken) {
    throw new Error('Failed to exchange custom token: ' + JSON.stringify(data))
  }
  return data.idToken
}

function hashDateOfBirth(dob) {
  return crypto.createHash('sha256').update(dob).digest('hex')
}

const testResults = []
function record(category, testName, passed, details = '') {
  testResults.push({ category, testName, passed, details })
  const symbol = passed ? '✅' : '❌'
  console.log(`${symbol} [${category}] ${testName} ${details ? `(${details})` : ''}`)
}

async function run() {
  console.log('🚀 Setting up test users and environment for Phase 6...')

  const adminUid = 'test-admin-phase6-' + Date.now()
  const voterUid1 = 'test-voter-phase6-1-' + Date.now()
  const voterUid2 = 'test-voter-phase6-2-' + Date.now()
  const voterUid3 = 'test-voter-phase6-3-' + Date.now() // Unregistered voter
  const nim1 = '2026' + Math.floor(1000 + Math.random() * 9000)
  const nim2 = '2026' + Math.floor(1000 + Math.random() * 9000)
  const nim3 = '2026' + Math.floor(1000 + Math.random() * 9000)
  const dob1 = '2002-05-15'
  const dob2 = '2001-11-20'
  const dob3 = '2003-01-10'

  // Admin user
  await auth.createUser({ uid: adminUid, email: `admin-${Date.now()}@example.com` })
  await db.collection('users').doc(adminUid).set({
    uid: adminUid,
    role: 'admin',
    name: 'Admin Phase 6',
    createdAt: FieldValue.serverTimestamp(),
  })

  // Voter 1
  await auth.createUser({ uid: voterUid1, email: `voter1-${Date.now()}@example.com` })
  await db.collection('users').doc(voterUid1).set({
    uid: voterUid1,
    role: 'voter',
    name: 'Voter Satu',
    nim: nim1,
    dateOfBirthHash: hashDateOfBirth(dob1),
    createdAt: FieldValue.serverTimestamp(),
  })

  // Voter 2
  await auth.createUser({ uid: voterUid2, email: `voter2-${Date.now()}@example.com` })
  await db.collection('users').doc(voterUid2).set({
    uid: voterUid2,
    role: 'voter',
    name: 'Voter Dua',
    nim: nim2,
    dateOfBirthHash: hashDateOfBirth(dob2),
    createdAt: FieldValue.serverTimestamp(),
  })

  // Voter 3 (Unregistered)
  await auth.createUser({ uid: voterUid3, email: `voter3-${Date.now()}@example.com` })
  await db.collection('users').doc(voterUid3).set({
    uid: voterUid3,
    role: 'voter',
    name: 'Voter Tiga',
    nim: nim3,
    dateOfBirthHash: hashDateOfBirth(dob3),
    createdAt: FieldValue.serverTimestamp(),
  })

  // ID Tokens
  const adminToken = await getFirebaseIdToken(adminUid)
  const voter1Token = await getFirebaseIdToken(voterUid1)
  const voter2Token = await getFirebaseIdToken(voterUid2)
  const voter3Token = await getFirebaseIdToken(voterUid3)

  console.log('✅ Tokens obtained.')

  // Setup Elections:
  // 1. Active Election
  const now = new Date()
  const startPast = new Date(now.getTime() - 2 * 3600 * 1000)
  const endFuture = new Date(now.getTime() + 2 * 3600 * 1000)
  const resultPubFuture = new Date(now.getTime() + 4 * 3600 * 1000)

  const activeElecRef = db.collection('elections').doc()
  const activeElectionId = activeElecRef.id
  await activeElecRef.set({
    title: 'Pemilihan Presma 2026 (ACTIVE)',
    description: 'Pemilihan Presiden Mahasiswa aktif',
    startAt: Timestamp.fromDate(startPast),
    endAt: Timestamp.fromDate(endFuture),
    resultPublishedAt: Timestamp.fromDate(resultPubFuture),
    status: 'SCHEDULED', // status is not DRAFT/CANCELLED
    createdBy: adminUid,
    createdAt: FieldValue.serverTimestamp(),
  })

  // Candidates for Active Election
  const cand1Ref = activeElecRef.collection('candidates').doc()
  const cand1Id = cand1Ref.id
  await cand1Ref.set({
    electionId: activeElectionId,
    number: 1,
    name: 'Paslon 01 Alpha & Omega',
    photoUrl: null,
    vision: 'Visi Paslon 1',
    mission: 'Misi Paslon 1',
    createdAt: FieldValue.serverTimestamp(),
  })

  const cand2Ref = activeElecRef.collection('candidates').doc()
  const cand2Id = cand2Ref.id
  await cand2Ref.set({
    electionId: activeElectionId,
    number: 2,
    name: 'Paslon 02 Bintang & Kejora',
    photoUrl: null,
    vision: 'Visi Paslon 2',
    mission: 'Misi Paslon 2',
    createdAt: FieldValue.serverTimestamp(),
  })

  // 2. Election B (with another candidate)
  const elecBRef = db.collection('elections').doc()
  const electionBId = elecBRef.id
  await elecBRef.set({
    title: 'Pemilihan DPM 2026 (ACTIVE)',
    description: 'Pemilihan Dewan Perwakilan Mahasiswa',
    startAt: Timestamp.fromDate(startPast),
    endAt: Timestamp.fromDate(endFuture),
    resultPublishedAt: Timestamp.fromDate(resultPubFuture),
    status: 'SCHEDULED',
    createdBy: adminUid,
    createdAt: FieldValue.serverTimestamp(),
  })

  const candBRef = elecBRef.collection('candidates').doc()
  const candBId = candBRef.id
  await candBRef.set({
    electionId: electionBId,
    number: 1,
    name: 'Paslon Lain Election B',
    photoUrl: null,
    vision: 'Visi B',
    mission: 'Misi B',
    createdAt: FieldValue.serverTimestamp(),
  })

  // 3. Scheduled Election (future)
  const schedElecRef = db.collection('elections').doc()
  const schedElectionId = schedElecRef.id
  await schedElecRef.set({
    title: 'Pemilihan Masa Depan (SCHEDULED)',
    description: 'Belum dibuka',
    startAt: Timestamp.fromDate(new Date(now.getTime() + 10 * 3600 * 1000)),
    endAt: Timestamp.fromDate(new Date(now.getTime() + 12 * 3600 * 1000)),
    resultPublishedAt: Timestamp.fromDate(new Date(now.getTime() + 14 * 3600 * 1000)),
    status: 'SCHEDULED',
    createdBy: adminUid,
    createdAt: FieldValue.serverTimestamp(),
  })

  // 4. Ended Election (past)
  const endedElecRef = db.collection('elections').doc()
  const endedElectionId = endedElecRef.id
  await endedElecRef.set({
    title: 'Pemilihan Kemarin (ENDED)',
    description: 'Sudah selesai',
    startAt: Timestamp.fromDate(new Date(now.getTime() - 10 * 3600 * 1000)),
    endAt: Timestamp.fromDate(new Date(now.getTime() - 2 * 3600 * 1000)),
    resultPublishedAt: Timestamp.fromDate(new Date(now.getTime() + 2 * 3600 * 1000)),
    status: 'SCHEDULED',
    createdBy: adminUid,
    createdAt: FieldValue.serverTimestamp(),
  })

  // 5. Cancelled Election
  const cancElecRef = db.collection('elections').doc()
  const cancElectionId = cancElecRef.id
  await cancElecRef.set({
    title: 'Pemilihan Batal (CANCELLED)',
    description: 'Dibatalkan',
    startAt: Timestamp.fromDate(startPast),
    endAt: Timestamp.fromDate(endFuture),
    resultPublishedAt: Timestamp.fromDate(resultPubFuture),
    status: 'CANCELLED',
    createdBy: adminUid,
    createdAt: FieldValue.serverTimestamp(),
  })

  // 6. Draft Election
  const draftElecRef = db.collection('elections').doc()
  const draftElectionId = draftElecRef.id
  await draftElecRef.set({
    title: 'Pemilihan Draf (DRAFT)',
    description: 'Belum dijadwalkan',
    startAt: null,
    endAt: null,
    resultPublishedAt: null,
    status: 'DRAFT',
    createdBy: adminUid,
    createdAt: FieldValue.serverTimestamp(),
  })

  // Register Voter 1 & Voter 2 for Active Election
  await db.collection('voters').doc(`${activeElectionId}_${voterUid1}`).set({
    electionId: activeElectionId,
    userId: voterUid1,
    hasVoted: false,
    createdAt: FieldValue.serverTimestamp(),
  })

  await db.collection('voters').doc(`${activeElectionId}_${voterUid2}`).set({
    electionId: activeElectionId,
    userId: voterUid2,
    hasVoted: false,
    createdAt: FieldValue.serverTimestamp(),
  })

  // Register Voter 1 for Scheduled Election
  await db.collection('voters').doc(`${schedElectionId}_${voterUid1}`).set({
    electionId: schedElectionId,
    userId: voterUid1,
    hasVoted: false,
    createdAt: FieldValue.serverTimestamp(),
  })

  // Register Voter 1 for Ended Election
  await db.collection('voters').doc(`${endedElectionId}_${voterUid1}`).set({
    electionId: endedElectionId,
    userId: voterUid1,
    hasVoted: false,
    createdAt: FieldValue.serverTimestamp(),
  })

  // Register Voter 1 for Cancelled Election
  await db.collection('voters').doc(`${cancElectionId}_${voterUid1}`).set({
    electionId: cancElectionId,
    userId: voterUid1,
    hasVoted: false,
    createdAt: FieldValue.serverTimestamp(),
  })

  console.log('✅ Test elections, candidates, and voter DPT ready.')

  // ==========================================
  // PHASE 6 TESTS
  // ==========================================
  console.log('\n--- EXECUTING PHASE 6 TESTS ---')

  // Test 1: Unauthenticated vote
  {
    const res = await fetch(`${BASE_URL}/api/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ electionId: activeElectionId, candidateId: cand1Id }),
    })
    record('Security', 'Unauthenticated vote request rejected with 401', res.status === 401, `Status: ${res.status}`)
  }

  // Test 2: Admin user tries to vote
  {
    const res = await fetch(`${BASE_URL}/api/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ electionId: activeElectionId, candidateId: cand1Id }),
    })
    record('Authorization', 'Non-voter (Admin) rejected with 403', res.status === 403, `Status: ${res.status}`)
  }

  // Test 3: Missing parameters
  {
    const res = await fetch(`${BASE_URL}/api/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${voter1Token}`,
      },
      body: JSON.stringify({ electionId: activeElectionId }),
    })
    record('Validation', 'Missing candidateId rejected with 400', res.status === 400, `Status: ${res.status}`)
  }

  // Test 4: Unregistered voter tries to vote
  {
    const res = await fetch(`${BASE_URL}/api/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${voter3Token}`,
      },
      body: JSON.stringify({ electionId: activeElectionId, candidateId: cand1Id }),
    })
    record('Authorization', 'Unregistered student in DPT rejected with 403', res.status === 403, `Status: ${res.status}`)
  }

  // Test 5: Vote on SCHEDULED election rejected
  {
    const res = await fetch(`${BASE_URL}/api/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${voter1Token}`,
      },
      body: JSON.stringify({ electionId: schedElectionId, candidateId: cand1Id }),
    })
    record('Lifecycle', 'Vote on SCHEDULED election rejected with 400', res.status === 400, `Status: ${res.status}`)
  }

  // Test 6: Vote on ENDED election rejected
  {
    const res = await fetch(`${BASE_URL}/api/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${voter1Token}`,
      },
      body: JSON.stringify({ electionId: endedElectionId, candidateId: cand1Id }),
    })
    record('Lifecycle', 'Vote on ENDED election rejected with 400', res.status === 400, `Status: ${res.status}`)
  }

  // Test 7: Vote on CANCELLED election rejected
  {
    const res = await fetch(`${BASE_URL}/api/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${voter1Token}`,
      },
      body: JSON.stringify({ electionId: cancElectionId, candidateId: cand1Id }),
    })
    record('Lifecycle', 'Vote on CANCELLED election rejected with 400', res.status === 400, `Status: ${res.status}`)
  }

  // Test 8: Vote for candidate from another election
  {
    const res = await fetch(`${BASE_URL}/api/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${voter1Token}`,
      },
      body: JSON.stringify({ electionId: activeElectionId, candidateId: candBId }),
    })
    record('Validation', 'Candidate from another election rejected with 404', res.status === 404, `Status: ${res.status}`)
  }

  // Test 9: Non-existent candidate
  {
    const res = await fetch(`${BASE_URL}/api/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${voter1Token}`,
      },
      body: JSON.stringify({ electionId: activeElectionId, candidateId: 'fake-cand-999' }),
    })
    record('Validation', 'Non-existent candidate rejected with 404', res.status === 404, `Status: ${res.status}`)
  }

  // Test 10: Successful Vote (Voter 1 votes for Candidate 1)
  {
    const res = await fetch(`${BASE_URL}/api/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${voter1Token}`,
      },
      body: JSON.stringify({ electionId: activeElectionId, candidateId: cand1Id }),
    })
    const data = await res.json()
    record('Functional', 'Valid voter submits ballot successfully (200 OK)', res.status === 200 && data.success === true, `Status: ${res.status}`)
  }

  // Test 11: Firestore State Verification for Voter 1 & Ballot
  {
    const voterDoc = await db.collection('voters').doc(`${activeElectionId}_${voterUid1}`).get()
    const voterData = voterDoc.data()
    const hasVotedUpdated = voterData?.hasVoted === true

    const ballotsSnap = await db.collection('ballots').where('electionId', '==', activeElectionId).get()
    const ballotDoc = ballotsSnap.docs[0]
    const ballotData = ballotDoc?.data()

    const hasNoUserId = ballotData && !('userId' in ballotData) && !('voterId' in ballotData) && !('nim' in ballotData) && !('name' in ballotData)
    const hasValidFields = ballotData?.candidateId === cand1Id && ballotData?.electionId === activeElectionId

    record('Consistency', 'voters/{electionId}_{userId}.hasVoted changed to true atomically', hasVotedUpdated, `hasVoted: ${voterData?.hasVoted}`)
    record('Privacy', 'ballots document contains NO voter identity (Secret Ballot)', hasNoUserId, `Fields: ${Object.keys(ballotData || {}).join(', ')}`)
    record('Data Integrity', 'ballots document accurately stores electionId and candidateId', hasValidFields && ballotsSnap.size === 1, `Total ballots: ${ballotsSnap.size}`)
  }

  // Test 12: DOUBLE VOTING REJECTION
  {
    const res = await fetch(`${BASE_URL}/api/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${voter1Token}`,
      },
      body: JSON.stringify({ electionId: activeElectionId, candidateId: cand2Id }),
    })
    record('Security', 'Double voting attempt rejected with 409 Conflict', res.status === 409, `Status: ${res.status}`)

    // Check ballots count hasn't changed
    const ballotsSnap = await db.collection('ballots').where('electionId', '==', activeElectionId).get()
    record('Security', 'Double voting prevented: ballot count remains 1', ballotsSnap.size === 1, `Ballots count: ${ballotsSnap.size}`)
  }

  // Test 13: Voter 2 votes successfully for Candidate 2
  {
    const res = await fetch(`${BASE_URL}/api/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${voter2Token}`,
      },
      body: JSON.stringify({ electionId: activeElectionId, candidateId: cand2Id }),
    })
    const data = await res.json()
    record('Functional', 'Second eligible voter votes for Candidate 2 successfully (200 OK)', res.status === 200 && data.success === true, `Status: ${res.status}`)

    const ballotsSnap = await db.collection('ballots').where('electionId', '==', activeElectionId).get()
    record('Consistency', 'Total ballots for election incremented to 2', ballotsSnap.size === 2, `Ballots count: ${ballotsSnap.size}`)
  }

  // Test 14: Voter portal API GET /api/voter/elections
  {
    const res = await fetch(`${BASE_URL}/api/voter/elections`, {
      headers: { Authorization: `Bearer ${voter1Token}` },
    })
    const data = await res.json()
    const activeElec = data.elections?.find(e => e.id === activeElectionId)
    const isVoted = activeElec?.hasVoted === true
    const isReg = activeElec?.isRegistered === true
    const isStateActive = activeElec?.computedState === 'ACTIVE'
    const noDraft = !data.elections?.some(e => e.computedState === 'DRAFT')

    record('Voter API', 'GET /api/voter/elections returns elections with computedState & hasVoted: true', res.status === 200 && isVoted && isReg && isStateActive && noDraft, `Status: ${res.status}, hasVoted: ${isVoted}`)
  }

  // Test 15: Voter portal API GET /api/voter/elections/[id]/candidates
  {
    const res = await fetch(`${BASE_URL}/api/voter/elections/${activeElectionId}/candidates`, {
      headers: { Authorization: `Bearer ${voter1Token}` },
    })
    const data = await res.json()
    const count = data.candidates?.length
    const sorted = count === 2 && data.candidates[0].number === 1 && data.candidates[1].number === 2

    record('Voter API', 'GET /api/voter/elections/[id]/candidates returns candidates ordered by number', res.status === 200 && sorted, `Count: ${count}`)
  }

  // Test 16: Admin cannot access voter portal API
  {
    const res = await fetch(`${BASE_URL}/api/voter/elections`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    record('Authorization', 'Admin accessing voter portal API rejected with 403', res.status === 403, `Status: ${res.status}`)
  }

  // ==========================================
  // REGRESSION TESTS (PHASE 2 - 5)
  // ==========================================
  console.log('\n--- EXECUTING REGRESSION TESTS (PHASE 2-5) ---')

  // Phase 2 Auth: student login endpoint
  {
    const res = await fetch(`${BASE_URL}/api/auth/student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nim: nim1, dateOfBirth: dob1 }),
    })
    const data = await res.json()
    record('Regression P2', 'Student login via NIM + DOB returns customToken', res.status === 200 && Boolean(data.customToken), `Status: ${res.status}`)
  }

  // Phase 3 Elections: admin election list & computed state
  {
    const res = await fetch(`${BASE_URL}/api/admin/elections`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    const data = await res.json()
    const foundActive = data.elections?.some(e => e.id === activeElectionId && e.computedState === 'ACTIVE')
    record('Regression P3', 'Admin elections listing returns correct computedState', res.status === 200 && foundActive, `Status: ${res.status}`)
  }

  // Phase 4 Candidates: admin candidate listing
  {
    const res = await fetch(`${BASE_URL}/api/admin/elections/${activeElectionId}/candidates`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    const data = await res.json()
    record('Regression P4', 'Admin candidates listing returns candidate list', res.status === 200 && data.candidates?.length === 2, `Count: ${data.candidates?.length}`)
  }

  // Phase 5 Voters: admin voter listing
  {
    const res = await fetch(`${BASE_URL}/api/admin/elections/${activeElectionId}/voters`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    const data = await res.json()
    const voter1InList = data.voters?.find(v => v.userId === voterUid1)
    const hasVotedCorrect = voter1InList?.hasVoted === true
    record('Regression P5', 'Admin voter listing reflects updated hasVoted from voting transaction', res.status === 200 && hasVotedCorrect, `hasVoted: ${voter1InList?.hasVoted}`)
  }

  // Cleanup test documents
  console.log('\nCleaning up test artifacts...')
  try {
    await db.collection('elections').doc(activeElectionId).collection('candidates').doc(cand1Id).delete()
    await db.collection('elections').doc(activeElectionId).collection('candidates').doc(cand2Id).delete()
    await db.collection('elections').doc(electionBId).collection('candidates').doc(candBId).delete()
    await activeElecRef.delete()
    await elecBRef.delete()
    await schedElecRef.delete()
    await endedElecRef.delete()
    await cancElecRef.delete()
    await draftElecRef.delete()

    await db.collection('voters').doc(`${activeElectionId}_${voterUid1}`).delete()
    await db.collection('voters').doc(`${activeElectionId}_${voterUid2}`).delete()
    await db.collection('voters').doc(`${schedElectionId}_${voterUid1}`).delete()
    await db.collection('voters').doc(`${endedElectionId}_${voterUid1}`).delete()
    await db.collection('voters').doc(`${cancElectionId}_${voterUid1}`).delete()

    const ballotsSnap = await db.collection('ballots').where('electionId', '==', activeElectionId).get()
    for (const bDoc of ballotsSnap.docs) {
      await bDoc.ref.delete()
    }

    await db.collection('users').doc(adminUid).delete()
    await db.collection('users').doc(voterUid1).delete()
    await db.collection('users').doc(voterUid2).delete()
    await db.collection('users').doc(voterUid3).delete()
    await auth.deleteUser(adminUid)
    await auth.deleteUser(voterUid1)
    await auth.deleteUser(voterUid2)
    await auth.deleteUser(voterUid3)
  } catch (e) {
    console.log('Cleanup notice:', e.message)
  }

  console.log('\n==========================================')
  console.log('PHASE 6 TEST SUMMARY')
  console.log('==========================================')
  const total = testResults.length
  const passed = testResults.filter(t => t.passed).length
  const failed = total - passed
  console.log(`Total Tests: ${total} | Passed: ${passed} | Failed: ${failed}`)

  if (failed > 0) {
    console.error('❌ Some tests failed!')
    process.exit(1)
  } else {
    console.log('✅ ALL TESTS PASSED SUCCESSFULLY!')
  }
}

run().catch(err => {
  console.error('Test execution error:', err)
  process.exit(1)
})
