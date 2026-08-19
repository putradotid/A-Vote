<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['admin']
})
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-h2">Elections</h1>
      <NuxtLink to="/admin/elections/create" class="btn-primary">Create Election</NuxtLink>
    </div>
    
    <div class="card p-8 text-center text-text-muted">
      <p>No elections found. Create one to get started.</p>
    </div>
  </div>
</template>
