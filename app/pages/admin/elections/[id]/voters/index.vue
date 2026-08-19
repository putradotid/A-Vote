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
      <div class="flex justify-between items-center">
        <h1 class="text-h2">Voters</h1>
        <button class="btn-primary">Add Voter</button>
      </div>
    </div>
    
    <div class="card p-8 text-center text-text-muted">
      <p>No voters registered.</p>
    </div>
  </div>
</template>
