import { verifyToken } from '../../utils/verify-token'
import { useAdminDb } from '../../utils/firebase-admin'
import { formatElectionDoc } from '../../utils/election-state'
import type { ElectionResult, CandidateResult } from '~/types'

export default defineEventHandler(async (event): Promise<ElectionResult> => {
  // 1. Verify ID Token
  const decodedToken = await verifyToken(event)
  const electionId = getRouterParam(event, 'electionId')

  if (!electionId) {
    throw createError({
      statusCode: 400,
      message: 'ID pemilihan tidak valid.',
    })
  }

  const db = useAdminDb()

  // 2. Determine user role from Firestore users collection
  const userDoc = await db.collection('users').doc(decodedToken.uid).get()
  const role = userDoc.exists ? userDoc.data()?.role : 'voter'

  // 3. Read election document
  const electionDoc = await db.collection('elections').doc(electionId).get()

  if (!electionDoc.exists) {
    throw createError({
      statusCode: 404,
      message: 'Pemilihan tidak ditemukan.',
    })
  }

  const formattedElection = formatElectionDoc(electionDoc)

  // DRAFT elections are not accessible
  if (formattedElection.computedState === 'DRAFT') {
    throw createError({
      statusCode: 404,
      message: 'Pemilihan tidak ditemukan.',
    })
  }

  // 4. Role-based access boundary
  // Voters can ONLY view results if computedState is RESULT_PUBLISHED
  if (role === 'voter' && formattedElection.computedState !== 'RESULT_PUBLISHED') {
    throw createError({
      statusCode: 403,
      message: 'Hasil pemilihan belum dipublikasikan.',
    })
  }

  // 5. Aggregate ballots and fetch candidate metadata
  const [candidatesSnap, ballotsSnap, votersCountSnap] = await Promise.all([
    db
      .collection('elections')
      .doc(electionId)
      .collection('candidates')
      .orderBy('number', 'asc')
      .get(),
    db
      .collection('ballots')
      .where('electionId', '==', electionId)
      .get(),
    db
      .collection('voters')
      .where('electionId', '==', electionId)
      .count()
      .get(),
  ])

  // Tally votes per candidate
  const candidateTally = new Map<string, number>()
  for (const ballotDoc of ballotsSnap.docs) {
    const candidateId = ballotDoc.data().candidateId
    if (candidateId) {
      candidateTally.set(candidateId, (candidateTally.get(candidateId) || 0) + 1)
    }
  }

  const totalVotes = ballotsSnap.size
  const totalEligibleVoters = votersCountSnap.data().count
  const participationRate = totalEligibleVoters > 0 ? totalVotes / totalEligibleVoters : 0

  const results: CandidateResult[] = candidatesSnap.docs.map((candDoc) => {
    const data = candDoc.data()
    const voteCount = candidateTally.get(candDoc.id) || 0
    const percentage = totalVotes > 0 ? voteCount / totalVotes : 0

    return {
      candidateId: candDoc.id,
      candidateName: data.name || '',
      candidateNumber: data.number ?? 0,
      photoUrl: data.photoUrl || null,
      voteCount,
      percentage,
    }
  })

  return {
    electionId,
    electionTitle: formattedElection.title,
    computedState: formattedElection.computedState,
    results,
    totalVotes,
    totalEligibleVoters,
    participationRate,
  }
})
