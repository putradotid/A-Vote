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
      <NuxtLink to="/admin/elections" class="text-small text-text-secondary hover:text-primary mb-2 inline-block">&larr; Back to Elections</NuxtLink>
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-h2">Election Details</h1>
          <p class="text-text-muted">ID: {{ route.params.id }}</p>
        </div>
        <span class="badge badge-draft">DRAFT</span>
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="md:col-span-1 space-y-2">
        <NuxtLink :to="`/admin/elections/${route.params.id}`" class="block p-3 rounded-button hover:bg-background text-primary font-medium bg-primary/10">Overview</NuxtLink>
        <NuxtLink :to="`/admin/elections/${route.params.id}/candidates`" class="block p-3 rounded-button hover:bg-background text-text-secondary">Candidates</NuxtLink>
        <NuxtLink :to="`/admin/elections/${route.params.id}/voters`" class="block p-3 rounded-button hover:bg-background text-text-secondary">Voters</NuxtLink>
        <NuxtLink :to="`/admin/elections/${route.params.id}/results`" class="block p-3 rounded-button hover:bg-background text-text-secondary">Results</NuxtLink>
      </div>
      
      <div class="md:col-span-3 card p-6">
        <h3 class="text-h3 mb-4">Overview</h3>
        <p class="text-text-muted">Election details will go here.</p>
      </div>
    </div>
  </div>
</template>
