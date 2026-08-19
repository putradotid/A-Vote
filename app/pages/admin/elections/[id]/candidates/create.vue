<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['admin']
})
const route = useRoute()
</script>

<template>
  <div>
    <h1 class="text-h2 mb-6">Add Candidate</h1>
    <div class="card p-6">
      <form class="space-y-6" @submit.prevent>
        <div>
          <label for="name" class="label">Candidate Name</label>
          <input id="name" type="text" class="input" placeholder="Name" />
        </div>
        <div>
          <label for="number" class="label">Candidate Number</label>
          <input id="number" type="number" class="input" />
        </div>
        <div>
          <label for="vision" class="label">Vision</label>
          <textarea id="vision" class="input" rows="3"></textarea>
        </div>
        <div>
          <label for="mission" class="label">Mission</label>
          <textarea id="mission" class="input" rows="3"></textarea>
        </div>
        <div class="flex justify-end gap-4">
          <NuxtLink :to="`/admin/elections/${route.params.id}/candidates`" class="btn-secondary">Cancel</NuxtLink>
          <button type="submit" class="btn-primary">Add Candidate</button>
        </div>
      </form>
    </div>
  </div>
</template>
