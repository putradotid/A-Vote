<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

const auth = useAuth()
const router = useRouter()

const nim = ref('')
const dob = ref('')
const errorMsg = ref('')
const isLoading = ref(false)

const handleLogin = async () => {
  errorMsg.value = ''

  const trimmedNim = nim.value.trim()
  const trimmedDob = dob.value.trim()

  if (!trimmedNim) {
    errorMsg.value = 'NIM wajib diisi'
    return
  }

  // Validate Date of Birth format (YYYY-MM-DD)
  const dobRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dobRegex.test(trimmedDob)) {
    errorMsg.value = 'Format Tanggal Lahir harus YYYY-MM-DD'
    return
  }

  isLoading.value = true

  const result = await auth.studentLogin(trimmedNim, trimmedDob)

  if (result.success) {
    router.push('/election')
  } else {
    errorMsg.value = result.error || 'Login gagal'
  }

  isLoading.value = false
}
</script>

<template>
  <div>
    <div class="text-center mb-8">
      <h1 class="text-h2 font-bold text-primary">Student Login</h1>
      <p class="text-text-secondary mt-2">Login with your NIM and Date of Birth</p>
    </div>

    <div v-if="errorMsg" class="bg-danger/10 text-danger p-3 rounded-button mb-4 text-small text-center border border-danger/20">
      {{ errorMsg }}
    </div>
    
    <form class="space-y-6" @submit.prevent="handleLogin">
      <div>
        <label for="nim" class="label">NIM (Nomor Induk Mahasiswa)</label>
        <input
          id="nim"
          v-model="nim"
          type="text"
          class="input"
          placeholder="22.11.1234"
          required
          :disabled="isLoading"
        />
      </div>
      
      <div>
        <label for="dob" class="label">Date of Birth</label>
        <input
          id="dob"
          v-model="dob"
          type="text"
          class="input"
          placeholder="YYYY-MM-DD"
          required
          :disabled="isLoading"
        />
        <p class="text-caption text-text-muted mt-1">Format: Tahun-Bulan-Tanggal</p>
      </div>
      
      <button type="submit" class="btn-primary w-full" :disabled="isLoading">
        {{ isLoading ? 'Logging In...' : 'Login' }}
      </button>

      <div class="text-center mt-4">
        <NuxtLink to="/admin/login" class="text-small text-text-muted hover:text-primary transition-colors">Admin Login</NuxtLink>
      </div>
    </form>
  </div>
</template>
