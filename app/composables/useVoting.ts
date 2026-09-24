import { ref } from 'vue'
import type { VoteResponse } from '~/types'

export const useVoting = () => {
  const auth = useAuth()
  const isSubmitting = ref(false)
  const errorMsg = ref<string | null>(null)
  const isSuccess = ref(false)

  const submitVote = async (electionId: string, candidateId: string): Promise<{ success: boolean; error?: string }> => {
    isSubmitting.value = true
    errorMsg.value = null

    try {
      const token = await auth.getIdToken()
      if (!token) {
        throw new Error('Sesi Anda telah berakhir. Silakan login kembali.')
      }

      await $fetch<VoteResponse>('/api/vote', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: {
          electionId,
          candidateId,
        },
      })

      isSuccess.value = true
      return { success: true }
    } catch (err: unknown) {
      let message = 'Gagal mengirimkan suara. Silakan coba lagi.'
      if (err && typeof err === 'object' && 'data' in err) {
        const fetchError = err as { data?: { message?: string } }
        if (fetchError.data?.message) {
          message = fetchError.data.message
        }
      } else if (err instanceof Error) {
        message = err.message
      }
      errorMsg.value = message
      return { success: false, error: message }
    } finally {
      isSubmitting.value = false
    }
  }

  const resetVotingState = () => {
    isSubmitting.value = false
    errorMsg.value = null
    isSuccess.value = false
  }

  return {
    isSubmitting,
    errorMsg,
    isSuccess,
    submitVote,
    resetVotingState,
  }
}
