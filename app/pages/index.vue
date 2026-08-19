<script setup lang="ts">
// Root redirect logic (stubbed for Phase 1)
// Phase 2 will implement redirecting to /login, /admin, or /election based on role
</script>

<template>
  <div class="p-8 text-center">
    <h1 class="text-h1 mb-4 text-primary">A-Vote System</h1>
    <p class="mb-4">Redirecting...</p>
    <div class="flex justify-center gap-4">
      <NuxtLink to="/login" class="btn-primary">Student Login</NuxtLink>
      <NuxtLink to="/admin/login" class="btn-secondary">Admin Login</NuxtLink>
    </div>
  </div>
</template>
