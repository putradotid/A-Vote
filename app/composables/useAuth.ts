import { ref, onMounted } from 'vue'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth'

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
      const message = error instanceof Error
        ? error.message
        : 'Login gagal. Periksa email dan password Anda.'

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
    logout,
  }
}
