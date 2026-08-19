<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['admin']
})
const route = useRoute()
</script>

<template>
  <div>
    <div class="mb-6">
      <NuxtLink :to="`/admin/elections/${route.params.id}`" class="text-small text-text-secondary hover:text-primary mb-2 inline-block">&larr; Back to Overview</NuxtLink>
      <h1 class="text-h2">Results</h1>
    </div>
    
    <div class="card p-8 text-center text-text-muted">
      <p>Results not available yet.</p>
    </div>
  </div>
</template>
