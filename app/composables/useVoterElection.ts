import { ref } from 'vue'
import type {
  VoterElectionItem,
  VoterElectionListResponse,
  VoterElectionDetailResponse,
  VoterCandidateItem,
  VoterCandidateListResponse,
} from '~/types'

export const useVoterElection = () => {
  const auth = useAuth()
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchElections = async (): Promise<VoterElectionItem[]> => {
    loading.value = true
    error.value = null
    try {
      const token = await auth.getIdToken()
      if (!token) throw new Error('Unauthenticated')

      const res = await $fetch<VoterElectionListResponse>('/api/voter/elections', {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.elections
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal memuat daftar pemilihan.'
      error.value = message
      return []
    } finally {
      loading.value = false
    }
  }

  const fetchElection = async (id: string): Promise<VoterElectionItem | null> => {
    loading.value = true
    error.value = null
    try {
      const token = await auth.getIdToken()
      if (!token) throw new Error('Unauthenticated')

      const res = await $fetch<VoterElectionDetailResponse>(`/api/voter/elections/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.election
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal memuat detail pemilihan.'
      error.value = message
      return null
    } finally {
      loading.value = false
    }
  }

  const fetchCandidates = async (id: string): Promise<VoterCandidateItem[]> => {
    loading.value = true
    error.value = null
    try {
      const token = await auth.getIdToken()
      if (!token) throw new Error('Unauthenticated')

      const res = await $fetch<VoterCandidateListResponse>(`/api/voter/elections/${id}/candidates`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.candidates
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal memuat daftar kandidat.'
      error.value = message
      return []
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchElections,
    fetchElection,
    fetchCandidates,
  }
}
