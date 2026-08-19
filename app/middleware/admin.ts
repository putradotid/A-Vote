export default defineNuxtRouteMiddleware(async (to, from) => {
  if (import.meta.client) {
    const auth = useAuth()
    
    if (!auth.isReady.value) {
      await new Promise<void>((resolve) => {
        const unwatch = watch(auth.isReady, (ready) => {
          if (ready) {
            unwatch()
            resolve()
          }
        })
      })
    }
    
    if (!auth.user.value) {
      return navigateTo('/admin/login')
    }
  }
})
