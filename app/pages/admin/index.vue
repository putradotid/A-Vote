<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['admin']
})
</script>

<template>
  <div>
    <h1 class="text-h2 mb-6">Admin Dashboard</h1>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="card p-6">
        <h3 class="text-h3 text-text-secondary mb-2">Total Elections</h3>
        <p class="text-4xl font-bold text-primary">0</p>
      </div>
      <div class="card p-6">
        <h3 class="text-h3 text-text-secondary mb-2">Active Elections</h3>
        <p class="text-4xl font-bold text-success">0</p>
      </div>
      <div class="card p-6">
        <h3 class="text-h3 text-text-secondary mb-2">Total Voters</h3>
        <p class="text-4xl font-bold text-info">0</p>
      </div>
    </div>
  </div>
</template>
