import { ref } from 'vue'
import type {
  VoterListItem,
  VoterListResponse,
  VoterDetailResponse,
  AddVoterRequest,
} from '~/types'

export const useVoterAdmin = () => {
  const auth = useAuth()
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  const getHeaders = async (): Promise<Record<string, string>> => {
    const token = await auth.getIdToken()
    if (!token) {
      throw new Error('Sesi telah berakhir. Silakan login kembali.')
    }
    return {
      Authorization: `Bearer ${token}`,
    }
  }

  const parseError = (err: unknown): string => {
    if (err && typeof err === 'object' && 'data' in err) {
      const fetchErr = err as { data?: { message?: string } }
      if (fetchErr.data?.message) {
        return fetchErr.data.message
      }
    }
    if (err instanceof Error) {
      return err.message
    }
    return 'Terjadi kesalahan pada server.'
  }

  // 1. Fetch all voters for an election
  const fetchVoters = async (
    electionId: string,
  ): Promise<{ voters: VoterListItem[]; totalCount: number; votedCount: number }> => {
    loading.value = true
    error.value = null
    try {
      const headers = await getHeaders()
      const response = await $fetch<VoterListResponse>(`/api/admin/elections/${electionId}/voters`, {
        headers,
      })
      return {
        voters: response.voters,
        totalCount: response.totalCount,
        votedCount: response.votedCount,
      }
    } catch (err) {
      const message = parseError(err)
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // 2. Fetch single voter detail
  const fetchVoter = async (electionId: string, voterId: string): Promise<VoterListItem> => {
    loading.value = true
    error.value = null
    try {
      const headers = await getHeaders()
      const response = await $fetch<VoterDetailResponse>(
        `/api/admin/elections/${electionId}/voters/${voterId}`,
        { headers },
      )
      return response.voter
    } catch (err) {
      const message = parseError(err)
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // 3. Add voter to election
  const addVoter = async (electionId: string, payload: AddVoterRequest): Promise<VoterListItem> => {
    loading.value = true
    error.value = null
    try {
      const headers = await getHeaders()
      const response = await $fetch<VoterDetailResponse>(`/api/admin/elections/${electionId}/voters`, {
        method: 'POST',
        headers,
        body: payload,
      })
      return response.voter
    } catch (err) {
      const message = parseError(err)
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // 4. Remove voter from election
  const removeVoter = async (electionId: string, voterId: string): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      const headers = await getHeaders()
      await $fetch(`/api/admin/elections/${electionId}/voters/${voterId}`, {
        method: 'DELETE',
        headers,
      })
    } catch (err) {
      const message = parseError(err)
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchVoters,
    fetchVoter,
    addVoter,
    removeVoter,
  }
}
