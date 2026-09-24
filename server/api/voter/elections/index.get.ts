import { requireVoter } from '../../../utils/verify-token'
import { useAdminDb } from '../../../utils/firebase-admin'
import { formatElectionDoc } from '../../../utils/election-state'
import type { VoterElectionItem, VoterElectionListResponse } from '~/types'

export default defineEventHandler(async (event): Promise<VoterElectionListResponse> => {
  const decodedToken = await requireVoter(event)
  const userId = decodedToken.uid

  const db = useAdminDb()

  // 1. Get all elections
  const electionsSnap = await db.collection('elections').get()

  // 2. Get voter registration records for this user
  const votersSnap = await db
    .collection('voters')
    .where('userId', '==', userId)
    .get()

  const voterRecords = new Map<string, { hasVoted: boolean }>()
  for (const doc of votersSnap.docs) {
    const data = doc.data()
    voterRecords.set(data.electionId, {
      hasVoted: data.hasVoted === true,
    })
  }

  const elections: VoterElectionItem[] = []

  for (const doc of electionsSnap.docs) {
    const formatted = formatElectionDoc(doc)
    // Voters must not see DRAFT elections
    if (formatted.computedState === 'DRAFT') {
      continue
    }

    const voterInfo = voterRecords.get(doc.id)
    const isRegistered = Boolean(voterInfo)
    const hasVoted = voterInfo ? voterInfo.hasVoted : false

    elections.push({
      id: formatted.id,
      title: formatted.title,
      description: formatted.description,
      startAt: formatted.startAt,
      endAt: formatted.endAt,
      resultPublishedAt: formatted.resultPublishedAt,
      computedState: formatted.computedState,
      isRegistered,
      hasVoted,
    })
  }

  // Sort by priority: ACTIVE first, then SCHEDULED, then ENDED, then RESULT_PUBLISHED, then CANCELLED
  const statePriority: Record<string, number> = {
    ACTIVE: 1,
    SCHEDULED: 2,
    ENDED: 3,
    RESULT_PUBLISHED: 4,
    CANCELLED: 5,
  }

  elections.sort((a, b) => {
    const pA = statePriority[a.computedState] || 99
    const pB = statePriority[b.computedState] || 99
    return pA - pB
  })

  return { elections }
})
