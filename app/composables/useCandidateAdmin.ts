import { ref } from 'vue'
import type {
  CandidateListItem,
  CandidateListResponse,
  CandidateDetailResponse,
  CreateCandidateRequest,
  UpdateCandidateRequest,
} from '~/types'

export const useCandidateAdmin = () => {
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

  // 1. Fetch all candidates for an election
  const fetchCandidates = async (electionId: string): Promise<CandidateListItem[]> => {
    loading.value = true
    error.value = null
    try {
      const headers = await getHeaders()
      const response = await $fetch<CandidateListResponse>(`/api/admin/elections/${electionId}/candidates`, {
        headers,
      })
      return response.candidates
    } catch (err) {
      const message = parseError(err)
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // 2. Fetch single candidate
  const fetchCandidate = async (electionId: string, candidateId: string): Promise<CandidateListItem> => {
    loading.value = true
    error.value = null
    try {
      const headers = await getHeaders()
      const response = await $fetch<CandidateDetailResponse>(`/api/admin/elections/${electionId}/candidates/${candidateId}`, {
        headers,
      })
      return response.candidate
    } catch (err) {
      const message = parseError(err)
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // 3. Create candidate
  const createCandidate = async (electionId: string, payload: CreateCandidateRequest): Promise<CandidateListItem> => {
    loading.value = true
    error.value = null
    try {
      const headers = await getHeaders()
      const response = await $fetch<CandidateDetailResponse>(`/api/admin/elections/${electionId}/candidates`, {
        method: 'POST',
        headers,
        body: payload,
      })
      return response.candidate
    } catch (err) {
      const message = parseError(err)
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // 4. Update candidate
  const updateCandidate = async (
    electionId: string,
    candidateId: string,
    payload: UpdateCandidateRequest,
  ): Promise<CandidateListItem> => {
    loading.value = true
    error.value = null
    try {
      const headers = await getHeaders()
      const response = await $fetch<{ success: boolean; candidate: CandidateListItem }>(
        `/api/admin/elections/${electionId}/candidates/${candidateId}`,
        {
          method: 'PATCH',
          headers,
          body: payload,
        },
      )
      return response.candidate
    } catch (err) {
      const message = parseError(err)
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // 5. Delete candidate
  const deleteCandidate = async (electionId: string, candidateId: string): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      const headers = await getHeaders()
      await $fetch(`/api/admin/elections/${electionId}/candidates/${candidateId}`, {
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
    fetchCandidates,
    fetchCandidate,
    createCandidate,
    updateCandidate,
    deleteCandidate,
  }
}
