import { ref } from 'vue'
import type {
  ElectionListItem,
  ElectionListResponse,
  ElectionDetailResponse,
  CreateElectionRequest,
  UpdateElectionRequest,
} from '~/types'

export const useElectionAdmin = () => {
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

  // 1. Fetch all elections
  const fetchElections = async (): Promise<ElectionListItem[]> => {
    loading.value = true
    error.value = null
    try {
      const headers = await getHeaders()
      const response = await $fetch<ElectionListResponse>('/api/admin/elections', {
        headers,
      })
      return response.elections
    } catch (err) {
      const message = parseError(err)
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // 2. Fetch single election by ID
  const fetchElection = async (id: string): Promise<ElectionListItem> => {
    loading.value = true
    error.value = null
    try {
      const headers = await getHeaders()
      const response = await $fetch<ElectionDetailResponse>(`/api/admin/elections/${id}`, {
        headers,
      })
      return response.election
    } catch (err) {
      const message = parseError(err)
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // 3. Create election
  const createElection = async (payload: CreateElectionRequest): Promise<ElectionListItem> => {
    loading.value = true
    error.value = null
    try {
      const headers = await getHeaders()
      const response = await $fetch<ElectionDetailResponse>('/api/admin/elections', {
        method: 'POST',
        headers,
        body: payload,
      })
      return response.election
    } catch (err) {
      const message = parseError(err)
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // 4. Update election
  const updateElection = async (id: string, payload: UpdateElectionRequest): Promise<ElectionListItem> => {
    loading.value = true
    error.value = null
    try {
      const headers = await getHeaders()
      const response = await $fetch<{ success: boolean; election: ElectionListItem }>(`/api/admin/elections/${id}`, {
        method: 'PATCH',
        headers,
        body: payload,
      })
      return response.election
    } catch (err) {
      const message = parseError(err)
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // 5. Delete election
  const deleteElection = async (id: string): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      const headers = await getHeaders()
      await $fetch(`/api/admin/elections/${id}`, {
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

  // 6. Cancel election (convenience shorthand)
  const cancelElection = async (id: string): Promise<ElectionListItem> => {
    return await updateElection(id, { status: 'CANCELLED' })
  }

  return {
    loading,
    error,
    fetchElections,
    fetchElection,
    createElection,
    updateElection,
    deleteElection,
    cancelElection,
  }
}
