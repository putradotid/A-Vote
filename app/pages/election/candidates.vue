<script setup lang="ts">
definePageMeta({
  layout: 'voter',
  middleware: ['voter']
})
</script>

<template>
  <div>
    <h1 class="text-h2 mb-6">Candidates</h1>
    <div class="card p-8 text-center text-text-muted">
      <p>No candidates available.</p>
    </div>
  </div>
</template>
