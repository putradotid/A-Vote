<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['admin']
})
const route = useRoute()
</script>

<template>
  <div>
    <h1 class="text-h2 mb-6">Edit Candidate</h1>
    <div class="card p-6">
      <form class="space-y-6" @submit.prevent>
        <!-- Form stub -->
        <div class="flex justify-end gap-4">
          <NuxtLink :to="`/admin/elections/${route.params.id}/candidates`" class="btn-secondary">Cancel</NuxtLink>
          <button type="submit" class="btn-primary">Save Changes</button>
        </div>
      </form>
    </div>
  </div>
</template>
