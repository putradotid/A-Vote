import { ref } from 'vue'
import type { ElectionResult } from '~/types'

export const useResults = () => {
  const auth = useAuth()
  const loading = ref(false)
  const error = ref<string | null>(null)
  const result = ref<ElectionResult | null>(null)

  const fetchResults = async (electionId: string): Promise<ElectionResult | null> => {
    loading.value = true
    error.value = null

    try {
      const token = await auth.getIdToken()
      if (!token) {
        throw new Error('Sesi Anda telah berakhir. Silakan login kembali.')
      }

      const res = await $fetch<ElectionResult>(`/api/results/${electionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      result.value = res
      return res
    } catch (err: unknown) {
      let message = 'Gagal memuat hasil pemilihan.'
      if (err && typeof err === 'object' && 'data' in err) {
        const fetchError = err as { data?: { message?: string } }
        if (fetchError.data?.message) {
          message = fetchError.data.message
        }
      } else if (err instanceof Error) {
        message = err.message
      }
      error.value = message
      result.value = null
      return null
    } finally {
      loading.value = false
    }
  }

  const publishResults = async (electionId: string): Promise<{ success: boolean; error?: string }> => {
    loading.value = true
    error.value = null

    try {
      const token = await auth.getIdToken()
      if (!token) {
        throw new Error('Sesi Anda telah berakhir. Silakan login kembali.')
      }

      await $fetch(`/api/admin/elections/${electionId}/publish`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Refresh results after publishing
      await fetchResults(electionId)
      return { success: true }
    } catch (err: unknown) {
      let message = 'Gagal mempublikasikan hasil pemilihan.'
      if (err && typeof err === 'object' && 'data' in err) {
        const fetchError = err as { data?: { message?: string } }
        if (fetchError.data?.message) {
          message = fetchError.data.message
        }
      } else if (err instanceof Error) {
        message = err.message
      }
      error.value = message
      return { success: false, error: message }
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    result,
    fetchResults,
    publishResults,
  }
}
