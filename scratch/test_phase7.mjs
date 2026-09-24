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
}, 'test-runner-phase7')

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
  console.log('🚀 Setting up test users and environment for Phase 7...')

  const adminUid = 'test-admin-phase7-' + Date.now()
  const voterUid1 = 'test-voter-phase7-1-' + Date.now()
  const voterUid2 = 'test-voter-phase7-2-' + Date.now()
  const voterUid3 = 'test-voter-phase7-3-' + Date.now()

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
    name: 'Admin Phase 7',
    createdAt: FieldValue.serverTimestamp(),
  })

  // Voters
  await auth.createUser({ uid: voterUid1, email: `voter1-${Date.now()}@example.com` })
  await db.collection('users').doc(voterUid1).set({
    uid: voterUid1,
    role: 'voter',
    name: 'Voter 1 Phase 7',
    nim: nim1,
    dateOfBirthHash: hashDateOfBirth(dob1),
    createdAt: FieldValue.serverTimestamp(),
  })

  await auth.createUser({ uid: voterUid2, email: `voter2-${Date.now()}@example.com` })
  await db.collection('users').doc(voterUid2).set({
    uid: voterUid2,
    role: 'voter',
    name: 'Voter 2 Phase 7',
    nim: nim2,
    dateOfBirthHash: hashDateOfBirth(dob2),
    createdAt: FieldValue.serverTimestamp(),
  })

  await auth.createUser({ uid: voterUid3, email: `voter3-${Date.now()}@example.com` })
  await db.collection('users').doc(voterUid3).set({
    uid: voterUid3,
    role: 'voter',
    name: 'Voter 3 Phase 7',
    nim: nim3,
    dateOfBirthHash: hashDateOfBirth(dob3),
    createdAt: FieldValue.serverTimestamp(),
  })

  const adminToken = await getFirebaseIdToken(adminUid)
  const voter1Token = await getFirebaseIdToken(voterUid1)

  console.log('✅ Auth tokens obtained.')

  const now = new Date()
  const past2h = new Date(now.getTime() - 2 * 3600 * 1000)
  const past1h = new Date(now.getTime() - 1 * 3600 * 1000)
  const future1h = new Date(now.getTime() + 1 * 3600 * 1000)
  const future2h = new Date(now.getTime() + 2 * 3600 * 1000)
  const future4h = new Date(now.getTime() + 4 * 3600 * 1000)

  // 1. Election ACTIVE (voting is open, results unpublished)
  const activeElecRef = db.collection('elections').doc()
  const activeElectionId = activeElecRef.id
  await activeElecRef.set({
    title: 'Pemilihan Presma 2026 (ACTIVE)',
    description: 'Pemilihan aktif',
    startAt: Timestamp.fromDate(past2h),
    endAt: Timestamp.fromDate(future2h),
    resultPublishedAt: Timestamp.fromDate(future4h),
    status: 'SCHEDULED',
    createdBy: adminUid,
    createdAt: FieldValue.serverTimestamp(),
  })

  // Candidates for Active Election
  const candA1Ref = activeElecRef.collection('candidates').doc()
  const candA1Id = candA1Ref.id
  await candA1Ref.set({
    electionId: activeElectionId,
    number: 1,
    name: 'Paslon 01 Garuda',
    photoUrl: null,
    vision: 'Visi 1',
    mission: 'Misi 1',
    createdAt: FieldValue.serverTimestamp(),
  })

  const candA2Ref = activeElecRef.collection('candidates').doc()
  const candA2Id = candA2Ref.id
  await candA2Ref.set({
    electionId: activeElectionId,
    number: 2,
    name: 'Paslon 02 Rajawali',
    photoUrl: null,
    vision: 'Visi 2',
    mission: 'Misi 2',
    createdAt: FieldValue.serverTimestamp(),
  })

  // 2. Election ENDED (voting ended, results scheduled in future, not yet published)
  const endedElecRef = db.collection('elections').doc()
  const endedElectionId = endedElecRef.id
  await endedElecRef.set({
    title: 'Pemilihan DPM 2026 (ENDED)',
    description: 'Pemilihan telah berakhir',
    startAt: Timestamp.fromDate(past2h),
    endAt: Timestamp.fromDate(past1h),
    resultPublishedAt: Timestamp.fromDate(future2h),
    status: 'SCHEDULED',
    createdBy: adminUid,
    createdAt: FieldValue.serverTimestamp(),
  })

  // Candidates for Ended Election (Paslon 1, 2, and 3 - Paslon 3 will have 0 votes)
  const candE1Ref = endedElecRef.collection('candidates').doc()
  const candE1Id = candE1Ref.id
  await candE1Ref.set({
    electionId: endedElectionId,
    number: 1,
    name: 'Paslon 01 Surya',
    photoUrl: null,
    vision: 'Visi E1',
    mission: 'Misi E1',
    createdAt: FieldValue.serverTimestamp(),
  })

  const candE2Ref = endedElecRef.collection('candidates').doc()
  const candE2Id = candE2Ref.id
  await candE2Ref.set({
    electionId: endedElectionId,
    number: 2,
    name: 'Paslon 02 Candra',
    photoUrl: null,
    vision: 'Visi E2',
    mission: 'Misi E2',
    createdAt: FieldValue.serverTimestamp(),
  })

  const candE3Ref = endedElecRef.collection('candidates').doc()
  const candE3Id = candE3Ref.id
  await candE3Ref.set({
    electionId: endedElectionId,
    number: 3,
    name: 'Paslon 03 Kartika (Zero Votes)',
    photoUrl: null,
    vision: 'Visi E3',
    mission: 'Misi E3',
    createdAt: FieldValue.serverTimestamp(),
  })

  // DPT for Ended Election: 3 voters
  await db.collection('voters').doc(`${endedElectionId}_${voterUid1}`).set({
    electionId: endedElectionId,
    userId: voterUid1,
    hasVoted: true,
    createdAt: FieldValue.serverTimestamp(),
  })
  await db.collection('voters').doc(`${endedElectionId}_${voterUid2}`).set({
    electionId: endedElectionId,
    userId: voterUid2,
    hasVoted: true,
    createdAt: FieldValue.serverTimestamp(),
  })
  await db.collection('voters').doc(`${endedElectionId}_${voterUid3}`).set({
    electionId: endedElectionId,
    userId: voterUid3,
    hasVoted: false, // Did not vote
    createdAt: FieldValue.serverTimestamp(),
  })

  // Cast ballots for Ended Election:
  // 1 ballot for candE1, 1 ballot for candE2, 0 ballots for candE3
  const ballot1Ref = db.collection('ballots').doc()
  await ballot1Ref.set({
    electionId: endedElectionId,
    candidateId: candE1Id,
    createdAt: FieldValue.serverTimestamp(),
  })

  const ballot2Ref = db.collection('ballots').doc()
  await ballot2Ref.set({
    electionId: endedElectionId,
    candidateId: candE2Id,
    createdAt: FieldValue.serverTimestamp(),
  })

  // 3. Election ZERO VOTES (ENDED, but 0 ballots cast)
  const zeroElecRef = db.collection('elections').doc()
  const zeroElectionId = zeroElecRef.id
  await zeroElecRef.set({
    title: 'Pemilihan Sepi 2026 (ZERO VOTES)',
    description: 'Pemilihan tanpa suara',
    startAt: Timestamp.fromDate(past2h),
    endAt: Timestamp.fromDate(past1h),
    resultPublishedAt: Timestamp.fromDate(past1h), // Already published
    status: 'SCHEDULED',
    createdBy: adminUid,
    createdAt: FieldValue.serverTimestamp(),
  })

  const candZ1Ref = zeroElecRef.collection('candidates').doc()
  const candZ1Id = candZ1Ref.id
  await candZ1Ref.set({
    electionId: zeroElectionId,
    number: 1,
    name: 'Paslon Tunggal',
    photoUrl: null,
    vision: 'Visi Z',
    mission: 'Misi Z',
    createdAt: FieldValue.serverTimestamp(),
  })

  console.log('✅ Test data prepared.')

  // ==========================================
  // PHASE 7 TESTS
  // ==========================================
  console.log('\n--- EXECUTING PHASE 7 TESTS ---')

  // Test 1: Unauthenticated call to results endpoint
  {
    const res = await fetch(`${BASE_URL}/api/results/${endedElectionId}`)
    record('Security', 'Unauthenticated request to /api/results rejected with 401', res.status === 401, `Status: ${res.status}`)
  }

  // Test 2: Voter accesses results of ACTIVE election (rejected)
  {
    const res = await fetch(`${BASE_URL}/api/results/${activeElectionId}`, {
      headers: { Authorization: `Bearer ${voter1Token}` },
    })
    record('Access Control', 'Voter accessing results of ACTIVE election rejected with 403', res.status === 403, `Status: ${res.status}`)
  }

  // Test 3: Voter accesses results of ENDED election before publication (rejected)
  {
    const res = await fetch(`${BASE_URL}/api/results/${endedElectionId}`, {
      headers: { Authorization: `Bearer ${voter1Token}` },
    })
    record('Access Control', 'Voter accessing results of ENDED election before publish rejected with 403', res.status === 403, `Status: ${res.status}`)
  }

  // Test 4: Admin accesses results of ACTIVE election (allowed for internal monitoring)
  {
    const res = await fetch(`${BASE_URL}/api/results/${activeElectionId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    const data = await res.json()
    record('Admin Monitoring', 'Admin can access results of ACTIVE election (200 OK)', res.status === 200 && data.computedState === 'ACTIVE', `Status: ${res.status}`)
  }

  // Test 5: Admin accesses results of ENDED election before publication (allowed)
  {
    const res = await fetch(`${BASE_URL}/api/results/${endedElectionId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    const data = await res.json()
    record('Admin Monitoring', 'Admin can access results of ENDED election before publish (200 OK)', res.status === 200 && data.computedState === 'ENDED', `Status: ${res.status}`)
  }

  // Test 6: Admin tries to publish when election is still ACTIVE (must be rejected)
  {
    const res = await fetch(`${BASE_URL}/api/admin/elections/${activeElectionId}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    record('Lifecycle Guard', 'Admin publish during ACTIVE election rejected with 400', res.status === 400, `Status: ${res.status}`)
  }

  // Test 7: Voter tries to call publish endpoint (must be rejected with 403)
  {
    const res = await fetch(`${BASE_URL}/api/admin/elections/${endedElectionId}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${voter1Token}` },
    })
    record('Authorization', 'Voter calling admin publish endpoint rejected with 403', res.status === 403, `Status: ${res.status}`)
  }

  // Test 8: Admin publishes results when election is ENDED (must succeed)
  {
    const res = await fetch(`${BASE_URL}/api/admin/elections/${endedElectionId}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    const data = await res.json()
    record('Publish Action', 'Admin successfully publishes results of ENDED election (200 OK)', res.status === 200 && data.success === true && data.computedState === 'RESULT_PUBLISHED', `Status: ${res.status}`)
  }

  // Test 9: Voter accesses results of election after publication (must succeed)
  let publishedResults = null
  {
    const res = await fetch(`${BASE_URL}/api/results/${endedElectionId}`, {
      headers: { Authorization: `Bearer ${voter1Token}` },
    })
    publishedResults = await res.json()
    record('Voter Access', 'Voter successfully accesses results after publication (200 OK)', res.status === 200 && publishedResults.computedState === 'RESULT_PUBLISHED', `Status: ${res.status}`)
  }

  // Test 10: Mathematical & Statistical Accuracy
  {
    const totalVotesCorrect = publishedResults.totalVotes === 2
    const totalEligibleCorrect = publishedResults.totalEligibleVoters === 3
    const participationRateCorrect = Math.abs(publishedResults.participationRate - (2 / 3)) < 0.001

    const cand1 = publishedResults.results.find(c => c.candidateId === candE1Id)
    const cand2 = publishedResults.results.find(c => c.candidateId === candE2Id)
    const cand3 = publishedResults.results.find(c => c.candidateId === candE3Id)

    const votesMatch = cand1?.voteCount === 1 && cand2?.voteCount === 1 && cand3?.voteCount === 0
    const percentagesMatch = Math.abs(cand1?.percentage - 0.5) < 0.001 && Math.abs(cand2?.percentage - 0.5) < 0.001 && cand3?.percentage === 0

    record('Math Accuracy', 'voteCount, totalVotes, totalEligible, and percentages are mathematically exact', totalVotesCorrect && totalEligibleCorrect && participationRateCorrect && votesMatch && percentagesMatch, `Votes: ${cand1?.voteCount}, ${cand2?.voteCount}, ${cand3?.voteCount}`)
  }

  // Test 11: Candidate without votes (0 votes, 0% percentage)
  {
    const cand3 = publishedResults.results.find(c => c.candidateId === candE3Id)
    const zeroVotesHandled = cand3 && cand3.voteCount === 0 && cand3.percentage === 0
    record('Edge Case', 'Candidate with 0 votes correctly reports voteCount: 0 and percentage: 0', zeroVotesHandled, `Candidate 3 votes: ${cand3?.voteCount}`)
  }

  // Test 12: Zero Votes Election (Total votes = 0, no division by zero error)
  {
    const res = await fetch(`${BASE_URL}/api/results/${zeroElectionId}`, {
      headers: { Authorization: `Bearer ${voter1Token}` },
    })
    const data = await res.json()
    const zeroSafe = res.status === 200 && data.totalVotes === 0 && data.participationRate === 0 && data.results[0]?.percentage === 0
    record('Edge Case', 'Zero votes election handles 0/0 without NaN or crash', zeroSafe, `totalVotes: ${data.totalVotes}, rate: ${data.participationRate}`)
  }

  // Test 13: Privacy & Zero Identity Leakage
  {
    const payloadStr = JSON.stringify(publishedResults)
    const hasNoVoterId = !payloadStr.includes(voterUid1) && !payloadStr.includes(voterUid2) && !payloadStr.includes(voterUid3)
    const hasNoNim = !payloadStr.includes(nim1) && !payloadStr.includes(nim2) && !payloadStr.includes(nim3)
    const hasNoDob = !payloadStr.includes(dob1) && !payloadStr.includes(dob2)
    const hasNoVoterKeys = !publishedResults.results.some(r => 'userId' in r || 'voterId' in r || 'nim' in r)

    record('Privacy', 'No voter identity (userId, NIM, voterId, name) leaked in results payload', hasNoVoterId && hasNoNim && hasNoDob && hasNoVoterKeys, 'Payload is purely aggregate data')
  }

  // Test 14: Ballot Immutability Verification
  {
    const b1Doc = await ballot1Ref.get()
    const b2Doc = await ballot2Ref.get()
    const b1Data = b1Doc.data()
    const b2Data = b2Doc.data()

    const ballotsIntact = b1Data.candidateId === candE1Id && b2Data.candidateId === candE2Id
    record('Immutability', 'Ballot documents remain completely unmodified during aggregation', ballotsIntact, 'Ballots intact')
  }

  // ==========================================
  // REGRESSION TESTS (PHASE 2 - 6)
  // ==========================================
  console.log('\n--- EXECUTING REGRESSION TESTS (PHASE 2-6) ---')

  // Phase 2: Student auth via NIM + DOB
  {
    const res = await fetch(`${BASE_URL}/api/auth/student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nim: nim1, dateOfBirth: dob1 }),
    })
    const data = await res.json()
    record('Regression P2', 'Student authentication via NIM + DOB functional', res.status === 200 && Boolean(data.customToken), `Status: ${res.status}`)
  }

  // Phase 3: Admin election detail
  {
    const res = await fetch(`${BASE_URL}/api/admin/elections/${activeElectionId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    const data = await res.json()
    record('Regression P3', 'Admin election detail functional with computedState', res.status === 200 && data.election?.computedState === 'ACTIVE', `Status: ${res.status}`)
  }

  // Phase 4: Candidate listing
  {
    const res = await fetch(`${BASE_URL}/api/admin/elections/${activeElectionId}/candidates`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    const data = await res.json()
    record('Regression P4', 'Candidate management listing functional', res.status === 200 && data.candidates?.length === 2, `Count: ${data.candidates?.length}`)
  }

  // Phase 5: Voter management
  {
    const res = await fetch(`${BASE_URL}/api/admin/elections/${endedElectionId}/voters`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    const data = await res.json()
    record('Regression P5', 'Voter DPT management listing functional', res.status === 200 && data.voters?.length === 3, `Count: ${data.voters?.length}`)
  }

  // Phase 6: Voting atomicity and double-voting prevention
  {
    // Register voter 1 for active election and vote
    const voterDocRef = db.collection('voters').doc(`${activeElectionId}_${voterUid1}`)
    await voterDocRef.set({
      electionId: activeElectionId,
      userId: voterUid1,
      hasVoted: false,
      createdAt: FieldValue.serverTimestamp(),
    })

    const voteRes = await fetch(`${BASE_URL}/api/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${voter1Token}`,
      },
      body: JSON.stringify({ electionId: activeElectionId, candidateId: candA1Id }),
    })
    const voteData = await voteRes.json()

    // Second vote attempt (must be rejected)
    const secondVoteRes = await fetch(`${BASE_URL}/api/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${voter1Token}`,
      },
      body: JSON.stringify({ electionId: activeElectionId, candidateId: candA2Id }),
    })

    record('Regression P6', 'Voting transaction and double-voting prevention functional', voteRes.status === 200 && voteData.success === true && secondVoteRes.status === 409, `Vote: ${voteRes.status}, Double: ${secondVoteRes.status}`)
  }

  // Cleanup test artifacts
  console.log('\nCleaning up test artifacts...')
  try {
    await activeElecRef.collection('candidates').doc(candA1Id).delete()
    await activeElecRef.collection('candidates').doc(candA2Id).delete()
    await endedElecRef.collection('candidates').doc(candE1Id).delete()
    await endedElecRef.collection('candidates').doc(candE2Id).delete()
    await endedElecRef.collection('candidates').doc(candE3Id).delete()
    await zeroElecRef.collection('candidates').doc(candZ1Id).delete()

    await activeElecRef.delete()
    await endedElecRef.delete()
    await zeroElecRef.delete()

    await ballot1Ref.delete()
    await ballot2Ref.delete()

    const activeBallots = await db.collection('ballots').where('electionId', '==', activeElectionId).get()
    for (const b of activeBallots.docs) await b.ref.delete()

    await db.collection('voters').doc(`${activeElectionId}_${voterUid1}`).delete()
    await db.collection('voters').doc(`${endedElectionId}_${voterUid1}`).delete()
    await db.collection('voters').doc(`${endedElectionId}_${voterUid2}`).delete()
    await db.collection('voters').doc(`${endedElectionId}_${voterUid3}`).delete()

    await db.collection('users').doc(adminUid).delete()
    await db.collection('users').doc(voterUid1).delete()
    await db.collection('users').doc(voterUid2).delete()
    await db.collection('users').doc(voterUid3).delete()

    await auth.deleteUser(adminUid)
    await auth.deleteUser(voterUid1)
    await auth.deleteUser(voterUid2)
    await auth.deleteUser(voterUid3)
  } catch (e) {
    console.log('Cleanup note:', e.message)
  }

  console.log('\n==========================================')
  console.log('PHASE 7 TEST SUMMARY')
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
