<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})
</script>

<template>
  <div>
    <div class="text-center mb-8">
      <h1 class="text-h2 font-bold text-primary">Admin Login</h1>
      <p class="text-text-secondary mt-2">Sign in to manage elections</p>
    </div>
    
    <form class="space-y-6" @submit.prevent>
      <div>
        <label for="email" class="label">Email Address</label>
        <input id="email" type="email" class="input" placeholder="admin@example.com" />
      </div>
      
      <div>
        <label for="password" class="label">Password</label>
        <input id="password" type="password" class="input" placeholder="••••••••" />
      </div>
      
      <button type="submit" class="btn-primary w-full">Sign In</button>
      
      <div class="text-center mt-4">
        <NuxtLink to="/login" class="text-small text-text-muted hover:text-primary transition-colors">Return to Student Login</NuxtLink>
      </div>
    </form>
  </div>
</template>
