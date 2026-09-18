<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

const router = useRouter()
const { createElection, loading, error: apiError } = useElectionAdmin()

const title = ref('')
const description = ref('')
const enableSchedule = ref(false)
const startAt = ref('')
const endAt = ref('')
const resultPublishedAt = ref('')

const validationErrors = ref<{
  title?: string
  description?: string
  startAt?: string
  endAt?: string
  resultPublishedAt?: string
  general?: string
}>({})

const validateForm = (): boolean => {
  validationErrors.value = {}

  if (!title.value.trim()) {
    validationErrors.value.title = 'Judul pemilihan wajib diisi.'
  } else if (title.value.trim().length < 3) {
    validationErrors.value.title = 'Judul pemilihan minimal 3 karakter.'
  } else if (title.value.trim().length > 150) {
    validationErrors.value.title = 'Judul pemilihan maksimal 150 karakter.'
  }

  if (!description.value.trim()) {
    validationErrors.value.description = 'Deskripsi pemilihan wajib diisi.'
  } else if (description.value.trim().length < 3) {
    validationErrors.value.description = 'Deskripsi pemilihan minimal 3 karakter.'
  } else if (description.value.trim().length > 2000) {
    validationErrors.value.description = 'Deskripsi pemilihan maksimal 2000 karakter.'
  }

  if (enableSchedule.value) {
    if (!startAt.value) {
      validationErrors.value.startAt = 'Waktu mulai voting wajib diisi.'
    }
    if (!endAt.value) {
      validationErrors.value.endAt = 'Waktu selesai voting wajib diisi.'
    }
    if (!resultPublishedAt.value) {
      validationErrors.value.resultPublishedAt = 'Waktu pengumuman hasil wajib diisi.'
    }

    if (startAt.value && endAt.value && resultPublishedAt.value) {
      const startDate = new Date(startAt.value)
      const endDate = new Date(endAt.value)
      const pubDate = new Date(resultPublishedAt.value)

      if (startDate <= new Date()) {
        validationErrors.value.startAt = 'Waktu mulai voting harus berada di masa depan.'
      }
      if (startDate >= endDate) {
        validationErrors.value.endAt = 'Waktu selesai voting harus setelah waktu mulai.'
      }
      if (endDate > pubDate) {
        validationErrors.value.resultPublishedAt = 'Waktu pengumuman hasil harus sama dengan atau setelah waktu selesai voting.'
      }
    }
  }

  return Object.keys(validationErrors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return

  try {
    const payload: {
      title: string
      description: string
      startAt?: string | null
      endAt?: string | null
      resultPublishedAt?: string | null
    } = {
      title: title.value.trim(),
      description: description.value.trim(),
    }

    if (enableSchedule.value && startAt.value && endAt.value && resultPublishedAt.value) {
      payload.startAt = new Date(startAt.value).toISOString()
      payload.endAt = new Date(endAt.value).toISOString()
      payload.resultPublishedAt = new Date(resultPublishedAt.value).toISOString()
    }

    const created = await createElection(payload)
    router.push(`/admin/elections/${created.id}`)
  } catch (err: unknown) {
    // apiError is set in composable
  }
}
</script>

<template>
  <div class="max-w-3xl">
    <!-- Breadcrumb & Header -->
    <div class="mb-6">
      <NuxtLink
        to="/admin/elections"
        class="text-small text-text-secondary hover:text-primary mb-2 inline-flex items-center gap-1 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Kembali ke Daftar Pemilihan
      </NuxtLink>
      <h1 class="text-h2 font-bold text-text-primary">Buat Pemilihan Baru</h1>
      <p class="text-small text-text-muted mt-1">Lengkapi informasi dasar agenda pemilihan baru.</p>
    </div>

    <!-- General / Server Error Alert -->
    <div
      v-if="apiError"
      class="mb-6 p-4 rounded-card bg-red-50 border border-red-200 text-danger text-small flex items-start gap-3"
    >
      <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      <div>{{ apiError }}</div>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Card: Informasi Dasar -->
      <div class="card p-6 space-y-4">
        <h2 class="text-h3 font-semibold text-text-primary border-b border-border pb-3">Informasi Dasar</h2>

        <!-- Title -->
        <div>
          <label for="title" class="label">Judul Pemilihan <span class="text-danger">*</span></label>
          <input
            id="title"
            v-model="title"
            type="text"
            placeholder="Contoh: Pemilihan Ketua & Wakil Ketua BEM 2026"
            :class="['input', validationErrors.title ? 'input-error' : '']"
            :disabled="loading"
          />
          <p v-if="validationErrors.title" class="field-error">{{ validationErrors.title }}</p>
        </div>

        <!-- Description -->
        <div>
          <label for="description" class="label">Deskripsi Pemilihan <span class="text-danger">*</span></label>
          <textarea
            id="description"
            v-model="description"
            rows="4"
            placeholder="Tuliskan latar belakang, tujuan, atau petunjuk umum mengenai agenda pemilihan ini..."
            :class="['input', validationErrors.description ? 'input-error' : '']"
            :disabled="loading"
          ></textarea>
          <p v-if="validationErrors.description" class="field-error">{{ validationErrors.description }}</p>
        </div>
      </div>

      <!-- Card: Jadwal Pemilihan (Opsional) -->
      <div class="card p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 class="text-h3 font-semibold text-text-primary">Jadwal Pemilihan</h2>
            <p class="text-caption text-text-muted">Atur waktu pelaksanaan pemungutan suara dan pengumuman hasil.</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              v-model="enableSchedule"
              class="sr-only peer"
              :disabled="loading"
            />
            <div class="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        <div v-if="enableSchedule" class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <!-- Start Date -->
          <div>
            <label for="startAt" class="label">Waktu Mulai Voting <span class="text-danger">*</span></label>
            <input
              id="startAt"
              v-model="startAt"
              type="datetime-local"
              :class="['input', validationErrors.startAt ? 'input-error' : '']"
              :disabled="loading"
            />
            <p v-if="validationErrors.startAt" class="field-error">{{ validationErrors.startAt }}</p>
          </div>

          <!-- End Date -->
          <div>
            <label for="endAt" class="label">Waktu Selesai Voting <span class="text-danger">*</span></label>
            <input
              id="endAt"
              v-model="endAt"
              type="datetime-local"
              :class="['input', validationErrors.endAt ? 'input-error' : '']"
              :disabled="loading"
            />
            <p v-if="validationErrors.endAt" class="field-error">{{ validationErrors.endAt }}</p>
          </div>

          <!-- Result Publication Date -->
          <div class="md:col-span-2">
            <label for="resultPublishedAt" class="label">Waktu Pengumuman Hasil <span class="text-danger">*</span></label>
            <input
              id="resultPublishedAt"
              v-model="resultPublishedAt"
              type="datetime-local"
              :class="['input', validationErrors.resultPublishedAt ? 'input-error' : '']"
              :disabled="loading"
            />
            <p class="text-caption text-text-muted mt-1">Harus sama atau setelah waktu selesai voting.</p>
            <p v-if="validationErrors.resultPublishedAt" class="field-error">{{ validationErrors.resultPublishedAt }}</p>
          </div>
        </div>
        <div v-else class="text-small text-text-muted italic">
          Jadwal belum diatur. Pemilihan akan disimpan sebagai <strong>DRAFT</strong> dan jadwal dapat diatur nanti.
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center justify-end gap-3 pt-2">
        <NuxtLink to="/admin/elections" class="btn-secondary" :class="{ 'pointer-events-none opacity-50': loading }">
          Batal
        </NuxtLink>
        <button type="submit" class="btn-primary" :disabled="loading">
          <span v-if="loading" class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
          {{ loading ? 'Menyimpan...' : 'Simpan Pemilihan' }}
        </button>
      </div>
    </form>
  </div>
</template>
