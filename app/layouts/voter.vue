<script setup lang="ts">
const auth = useAuth()
const router = useRouter()

const handleLogout = async () => {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col">
    <!-- Header -->
    <header class="bg-surface border-b border-border shadow-sm z-10 relative">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <NuxtLink to="/election" class="font-bold text-xl text-primary hover:opacity-90">A-Vote</NuxtLink>
          <span class="text-caption bg-blue-50 text-primary border border-blue-200 px-2 py-0.5 rounded-full font-semibold">Portal Pemilih</span>
        </div>
        <div class="flex items-center gap-4">
          <!-- User Profile Stub -->
          <div class="text-small text-text-secondary">{{ auth.user.value?.displayName || 'Student User' }}</div>
          <button @click="handleLogout" class="text-small text-text-muted hover:text-danger transition-colors">Logout</button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>
  </div>
</template>
