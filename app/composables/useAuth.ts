import { ref, onMounted } from 'vue'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, signInWithCustomToken, type User as FirebaseUser } from 'firebase/auth'
import type { StudentLoginResponse } from '~/types'

export const useAuth = () => {
  const { $firebaseAuth } = useNuxtApp()
  const user = useState<FirebaseUser | null>('firebase-user', () => null)
  const isReady = useState<boolean>('firebase-auth-ready', () => false)

  // Initialize auth state listener
  onMounted(() => {
    if (import.meta.client && !isReady.value) {
      onAuthStateChanged($firebaseAuth, (currentUser) => {
        user.value = currentUser
        isReady.value = true
      })
    }
  })

  // Get current ID token
  const getIdToken = async (): Promise<string | null> => {
    if (!user.value) return null
    return await user.value.getIdToken()
  }

  // Admin login
  const adminLogin = async (email: string, password: string) => {
    try {
      const credential = await signInWithEmailAndPassword($firebaseAuth, email, password)
      user.value = credential.user
      return { success: true }
    } catch (error: unknown) {
      let message = 'Login gagal. Periksa email dan password Anda.'

      const errorCode = error && typeof error === 'object' && 'code' in error
        ? String((error as { code: unknown }).code)
        : ''

      const errorText = error instanceof Error ? error.message : ''

      if (
        errorCode === 'auth/invalid-credential' ||
        errorCode === 'auth/user-not-found' ||
        errorCode === 'auth/wrong-password' ||
        errorText.includes('auth/invalid-credential')
      ) {
        message = 'Email atau password salah.'
      } else if (errorText) {
        message = errorText
      }

      return {
        success: false,
        error: message,
      }
    }
  }

  // Student login
  const studentLogin = async (nim: string, dateOfBirth: string) => {
    try {
      const response = await $fetch<StudentLoginResponse>('/api/auth/student', {
        method: 'POST',
        body: { nim, dateOfBirth },
      })

      const credential = await signInWithCustomToken($firebaseAuth, response.customToken)
      user.value = credential.user
      return { success: true }
    } catch (error: unknown) {
      let message = 'Login gagal. Periksa NIM dan Tanggal Lahir Anda.'

      if (error && typeof error === 'object' && 'data' in error) {
        const fetchError = error as { data?: { message?: string } }
        if (fetchError.data?.message) {
          message = fetchError.data.message
        }
      } else if (error instanceof Error) {
        message = error.message
      }

      return {
        success: false,
        error: message,
      }
    }
  }

  // Logout
  const logout = async () => {
    await signOut($firebaseAuth)
    user.value = null
  }

  return {
    user,
    isReady,
    getIdToken,
    adminLogin,
    studentLogin,
    logout,
  }
}
