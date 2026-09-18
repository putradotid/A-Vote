<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { ElectionListItem, UpdateElectionRequest } from '~/types'

definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

const route = useRoute()
const router = useRouter()
const electionId = computed(() => route.params.id as string)

const {
  fetchElection,
  updateElection,
  loading: isActionLoading,
  error: apiError,
} = useElectionAdmin()

const election = ref<ElectionListItem | null>(null)
const pageLoading = ref(true)

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
}>({})

// Helper to convert ISO string to HTML datetime-local format (YYYY-MM-DDTHH:mm)
const toDatetimeLocal = (isoString: string | null): string => {
  if (!isoString) return ''
  const date = new Date(isoString)
  const pad = (n: number) => n.toString().padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const isResultPublished = computed(() => {
  return election.value?.computedState === 'RESULT_PUBLISHED'
})

const isVotingStartedOrEnded = computed(() => {
  const state = election.value?.computedState
  return state === 'ACTIVE' || state === 'ENDED'
})

const loadData = async () => {
  pageLoading.value = true
  try {
    const data = await fetchElection(electionId.value)
    election.value = data
    title.value = data.title
    description.value = data.description

    if (data.startAt && data.endAt && data.resultPublishedAt) {
      enableSchedule.value = true
      startAt.value = toDatetimeLocal(data.startAt)
      endAt.value = toDatetimeLocal(data.endAt)
      resultPublishedAt.value = toDatetimeLocal(data.resultPublishedAt)
    } else {
      enableSchedule.value = false
    }
  } catch {
    // handled in composable
  } finally {
    pageLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

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

  if (isVotingStartedOrEnded.value) {
    if (!resultPublishedAt.value) {
      validationErrors.value.resultPublishedAt = 'Waktu pengumuman hasil wajib diisi.'
    } else if (election.value?.endAt) {
      const endDate = new Date(election.value.endAt)
      const pubDate = new Date(resultPublishedAt.value)
      if (pubDate < endDate) {
        validationErrors.value.resultPublishedAt = 'Waktu pengumuman hasil harus sama atau setelah waktu selesai voting.'
      }
    }
  } else if (!isResultPublished.value && enableSchedule.value) {
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
        validationErrors.value.resultPublishedAt = 'Waktu pengumuman hasil harus sama atau setelah waktu selesai voting.'
      }
    }
  }

  return Object.keys(validationErrors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return

  try {
    const payload: UpdateElectionRequest = {
      title: title.value.trim(),
      description: description.value.trim(),
    }

    if (isVotingStartedOrEnded.value) {
      if (resultPublishedAt.value) {
        payload.resultPublishedAt = new Date(resultPublishedAt.value).toISOString()
      }
    } else if (!isResultPublished.value) {
      if (enableSchedule.value && startAt.value && endAt.value && resultPublishedAt.value) {
        payload.startAt = new Date(startAt.value).toISOString()
        payload.endAt = new Date(endAt.value).toISOString()
        payload.resultPublishedAt = new Date(resultPublishedAt.value).toISOString()
      } else {
        // Clearing schedule
        payload.startAt = null
        payload.endAt = null
        payload.resultPublishedAt = null
        payload.status = 'DRAFT'
      }
    }

    await updateElection(electionId.value, payload)
    router.push(`/admin/elections/${electionId.value}`)
  } catch {
    // apiError is set in composable
  }
}
</script>

<template>
  <div class="max-w-3xl">
    <!-- Breadcrumb -->
    <div class="mb-6">
      <NuxtLink
        :to="`/admin/elections/${electionId}`"
        class="text-small text-text-secondary hover:text-primary mb-2 inline-flex items-center gap-1 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Kembali ke Rincian Pemilihan
      </NuxtLink>
      <h1 class="text-h2 font-bold text-text-primary">Edit Pemilihan</h1>
      <p class="text-small text-text-muted mt-1">Perbarui judul, deskripsi, atau jadwal pelaksanaan pemilihan.</p>
    </div>

    <!-- Page Loading -->
    <div v-if="pageLoading" class="card p-12 text-center text-text-muted">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
      <p class="text-body">Memuat data pemilihan...</p>
    </div>

    <!-- Cancelled Warning -->
    <div
      v-else-if="election?.computedState === 'CANCELLED'"
      class="card p-8 text-center text-danger"
    >
      <h3 class="text-h3 font-bold mb-2">Pemilihan Ini Telah Dibatalkan</h3>
      <p class="text-body text-text-muted mb-4">Pemilihan yang telah dibatalkan tidak dapat diedit kembali.</p>
      <NuxtLink :to="`/admin/elections/${electionId}`" class="btn-secondary">
        Kembali ke Rincian
      </NuxtLink>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Error Alert -->
      <div
        v-if="apiError"
        class="p-4 rounded-card bg-red-50 border border-red-200 text-danger text-small flex items-start gap-3"
      >
        <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <div>{{ apiError }}</div>
      </div>

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
            :disabled="isActionLoading"
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
            :class="['input', validationErrors.description ? 'input-error' : '']"
            :disabled="isActionLoading"
          ></textarea>
          <p v-if="validationErrors.description" class="field-error">{{ validationErrors.description }}</p>
        </div>
      </div>

      <!-- Card: Jadwal Pemilihan -->
      <div class="card p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 class="text-h3 font-semibold text-text-primary">Jadwal Pemilihan</h2>
            <p class="text-caption text-text-muted">Atur tanggal dan jam voting serta publikasi hasil.</p>
          </div>
          <label v-if="!isResultPublished && !isVotingStartedOrEnded" class="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              v-model="enableSchedule"
              class="sr-only peer"
              :disabled="isActionLoading"
            />
            <div class="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        <!-- Case 1: Result Published (All locked) -->
        <div v-if="isResultPublished" class="p-3 bg-slate-100 border border-border rounded text-text-secondary text-small">
          Jadwal tidak dapat diubah karena hasil pemilihan telah dipublikasikan (<strong>RESULT_PUBLISHED</strong>).
        </div>

        <!-- Case 2: ACTIVE or ENDED (startAt & endAt locked, resultPublishedAt editable) -->
        <div v-else-if="isVotingStartedOrEnded" class="space-y-4">
          <div class="p-3 bg-amber-50 border border-amber-200 rounded text-warning text-small">
            Waktu mulai dan selesai voting telah dikunci karena pemilihan saat ini berstatus <strong>{{ election?.computedState }}</strong>. Waktu pengumuman hasil dapat disesuaikan selama hasil belum dipublikasikan.
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <!-- Start Date (Locked) -->
            <div>
              <label for="startAt" class="label text-text-muted">Waktu Mulai Voting (Terkunci)</label>
              <input
                id="startAt"
                v-model="startAt"
                type="datetime-local"
                class="input bg-slate-100 cursor-not-allowed opacity-75"
                disabled
              />
            </div>

            <!-- End Date (Locked) -->
            <div>
              <label for="endAt" class="label text-text-muted">Waktu Selesai Voting (Terkunci)</label>
              <input
                id="endAt"
                v-model="endAt"
                type="datetime-local"
                class="input bg-slate-100 cursor-not-allowed opacity-75"
                disabled
              />
            </div>

            <!-- Result Publication Date (Editable) -->
            <div class="md:col-span-2">
              <label for="resultPublishedAt" class="label">Waktu Pengumuman Hasil <span class="text-danger">*</span></label>
              <input
                id="resultPublishedAt"
                v-model="resultPublishedAt"
                type="datetime-local"
                :class="['input', validationErrors.resultPublishedAt ? 'input-error' : '']"
                :disabled="isActionLoading"
              />
              <p class="text-caption text-text-muted mt-1">Harus sama atau setelah waktu selesai voting.</p>
              <p v-if="validationErrors.resultPublishedAt" class="field-error">{{ validationErrors.resultPublishedAt }}</p>
            </div>
          </div>
        </div>

        <!-- Case 3: DRAFT or SCHEDULED -->
        <div v-else-if="enableSchedule" class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <!-- Start Date -->
          <div>
            <label for="startAt" class="label">Waktu Mulai Voting <span class="text-danger">*</span></label>
            <input
              id="startAt"
              v-model="startAt"
              type="datetime-local"
              :class="['input', validationErrors.startAt ? 'input-error' : '']"
              :disabled="isActionLoading"
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
              :disabled="isActionLoading"
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
              :disabled="isActionLoading"
            />
            <p class="text-caption text-text-muted mt-1">Harus sama atau setelah waktu selesai voting.</p>
            <p v-if="validationErrors.resultPublishedAt" class="field-error">{{ validationErrors.resultPublishedAt }}</p>
          </div>
        </div>

        <div v-else class="text-small text-text-muted italic">
          Jadwal dinonaktifkan. Menyimpan formulir ini akan mengembalikan status ke <strong>DRAFT</strong>.
        </div>
      </div>

      <!-- Submit & Cancel -->
      <div class="flex items-center justify-end gap-3 pt-2">
        <NuxtLink
          :to="`/admin/elections/${electionId}`"
          class="btn-secondary"
          :class="{ 'pointer-events-none opacity-50': isActionLoading }"
        >
          Batal
        </NuxtLink>
        <button type="submit" class="btn-primary" :disabled="isActionLoading">
          <span v-if="isActionLoading" class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
          {{ isActionLoading ? 'Menyimpan...' : 'Perbarui Pemilihan' }}
        </button>
      </div>
    </form>
  </div>
</template>
