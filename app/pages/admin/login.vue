<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

const auth = useAuth()
const router = useRouter()

const email = ref('')
const password = ref('')
const errorMsg = ref('')
const isLoading = ref(false)

const handleLogin = async () => {
  errorMsg.value = ''
  isLoading.value = true
  
  const result = await auth.adminLogin(email.value, password.value)
  
  if (result.success) {
    router.push('/admin')
  } else {
    errorMsg.value = result.error || 'Login failed'
  }
  
  isLoading.value = false
}
</script>

<template>
  <div>
    <div class="text-center mb-8">
      <h1 class="text-h2 font-bold text-primary">Admin Login</h1>
      <p class="text-text-secondary mt-2">Sign in to manage elections</p>
    </div>
    
    <div v-if="errorMsg" class="bg-danger/10 text-danger p-3 rounded-button mb-4 text-small text-center border border-danger/20">
      {{ errorMsg }}
    </div>
    
    <form class="space-y-6" @submit.prevent="handleLogin">
      <div>
        <label for="email" class="label">Email Address</label>
        <input id="email" v-model="email" type="email" class="input" placeholder="admin@example.com" required :disabled="isLoading" />
      </div>
      
      <div>
        <label for="password" class="label">Password</label>
        <input id="password" v-model="password" type="password" class="input" placeholder="••••••••" required :disabled="isLoading" />
      </div>
      
      <button type="submit" class="btn-primary w-full" :disabled="isLoading">
        {{ isLoading ? 'Signing In...' : 'Sign In' }}
      </button>
      
      <div class="text-center mt-4">
        <NuxtLink to="/login" class="text-small text-text-muted hover:text-primary transition-colors">Return to Student Login</NuxtLink>
      </div>
    </form>
  </div>
</template>
