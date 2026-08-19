<script setup lang="ts">
definePageMeta({
  layout: 'voter',
  middleware: ['voter']
})
</script>

<template>
  <div>
    <h1 class="text-h2 mb-6">Your Elections</h1>
    <div class="card p-8 text-center text-text-muted">
      <p>No elections found.</p>
    </div>
  </div>
</template>
