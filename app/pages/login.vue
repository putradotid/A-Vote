<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})
</script>

<template>
  <div>
    <div class="text-center mb-8">
      <h1 class="text-h2 font-bold text-primary">Student Login</h1>
      <p class="text-text-secondary mt-2">Login with your NIM and Date of Birth</p>
    </div>
    
    <form class="space-y-6" @submit.prevent>
      <div>
        <label for="nim" class="label">NIM (Nomor Induk Mahasiswa)</label>
        <input id="nim" type="text" class="input" placeholder="Enter your NIM" />
      </div>
      
      <div>
        <label for="dob" class="label">Date of Birth</label>
        <input id="dob" type="date" class="input" />
      </div>
      
      <button type="submit" class="btn-primary w-full">Login</button>
    </form>
  </div>
</template>
