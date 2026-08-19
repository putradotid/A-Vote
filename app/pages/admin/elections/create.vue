<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['admin']
})
</script>

<template>
  <div>
    <h1 class="text-h2 mb-6">Create Election</h1>
    <div class="card p-6">
      <form class="space-y-6" @submit.prevent>
        <div>
          <label for="title" class="label">Election Title</label>
          <input id="title" type="text" class="input" placeholder="e.g., Pemilihan Presiden BEM 2026" />
        </div>
        <div>
          <label for="description" class="label">Description</label>
          <textarea id="description" class="input" rows="4"></textarea>
        </div>
        <div class="flex justify-end gap-4">
          <NuxtLink to="/admin/elections" class="btn-secondary">Cancel</NuxtLink>
          <button type="submit" class="btn-primary">Create</button>
        </div>
      </form>
    </div>
  </div>
</template>
