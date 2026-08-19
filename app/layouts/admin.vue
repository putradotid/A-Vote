<script setup lang="ts">
const auth = useAuth()
const router = useRouter()

const handleLogout = async () => {
  await auth.logout()
  router.push('/admin/login')
}
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col">
    <!-- Header -->
    <header class="bg-surface border-b border-border shadow-sm z-10 relative">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="font-bold text-xl text-primary">A-Vote</div>
          <div class="text-small text-text-muted hidden sm:block">| Admin</div>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-small text-text-secondary">{{ auth.user.value?.email || 'Admin User' }}</div>
          <button @click="handleLogout" class="text-small text-text-muted hover:text-danger transition-colors">Logout</button>
        </div>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar Navigation -->
      <aside class="w-64 bg-surface border-r border-border hidden md:block overflow-y-auto">
        <nav class="p-4 space-y-1">
          <NuxtLink to="/admin" class="block px-3 py-2 rounded-button text-small font-medium text-text-primary hover:bg-background" active-class="bg-primary/10 text-primary">
            Dashboard
          </NuxtLink>
          <NuxtLink to="/admin/elections" class="block px-3 py-2 rounded-button text-small font-medium text-text-primary hover:bg-background" active-class="bg-primary/10 text-primary">
            Elections
          </NuxtLink>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto p-6 md:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>
