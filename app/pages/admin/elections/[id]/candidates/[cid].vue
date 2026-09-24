<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { ElectionListItem, CandidateListItem, ElectionState } from '~/types'

definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

const route = useRoute()
const router = useRouter()
const electionId = computed(() => route.params.id as string)
const candidateId = computed(() => route.params.cid as string)

const { fetchElection } = useElectionAdmin()
const { fetchCandidate, updateCandidate, loading: isSubmitting, error: apiError } = useCandidateAdmin()

const election = ref<ElectionListItem | null>(null)
const candidate = ref<CandidateListItem | null>(null)
const pageLoading = ref(true)
const pageError = ref<string | null>(null)

// Form fields
const number = ref<number | ''>('')
const name = ref('')
const photoUrl = ref('')
const vision = ref('')
const mission = ref('')

const validationErrors = ref<{
  number?: string
  name?: string
  photoUrl?: string
  vision?: string
  mission?: string
}>({})

const imagePreviewError = ref(false)

const isEditable = computed(() => {
  const state = election.value?.computedState
  return state === 'DRAFT' || state === 'SCHEDULED'
})

const getBadgeClass = (state?: ElectionState) => {
  switch (state) {
    case 'DRAFT':
      return 'badge-draft'
    case 'SCHEDULED':
      return 'badge-scheduled'
    case 'ACTIVE':
      return 'badge-active'
    case 'ENDED':
      return 'badge-ended'
    case 'RESULT_PUBLISHED':
      return 'badge-published'
    case 'CANCELLED':
      return 'badge-cancelled'
    default:
      return 'badge-draft'
  }
}

const loadData = async () => {
  pageLoading.value = true
  pageError.value = null
  try {
    const [elecData, candData] = await Promise.all([
      fetchElection(electionId.value),
      fetchCandidate(electionId.value, candidateId.value),
    ])
    election.value = elecData
    candidate.value = candData

    // Populate form
    number.value = candData.number
    name.value = candData.name
    photoUrl.value = candData.photoUrl || ''
    vision.value = candData.vision
    mission.value = candData.mission
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Gagal memuat data kandidat.'
  } finally {
    pageLoading.value = false
  }
}

const validateForm = (): boolean => {
  const errors: typeof validationErrors.value = {}

  if (number.value === '' || number.value === null || number.value < 1 || !Number.isInteger(Number(number.value))) {
    errors.number = 'Nomor urut paslon wajib berupa bilangan bulat positif (>= 1).'
  }

  const trimmedName = name.value.trim()
  if (!trimmedName || trimmedName.length < 2) {
    errors.name = 'Nama paslon wajib diisi minimal 2 karakter.'
  } else if (trimmedName.length > 150) {
    errors.name = 'Nama paslon maksimal 150 karakter.'
  }

  const trimmedVision = vision.value.trim()
  if (!trimmedVision) {
    errors.vision = 'Visi paslon wajib diisi.'
  }

  const trimmedMission = mission.value.trim()
  if (!trimmedMission) {
    errors.mission = 'Misi paslon wajib diisi.'
  }

  validationErrors.value = errors
  return Object.keys(errors).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return
  if (!isEditable.value) return

  try {
    await updateCandidate(electionId.value, candidateId.value, {
      number: Number(number.value),
      name: name.value.trim(),
      photoUrl: photoUrl.value.trim() || null,
      vision: vision.value.trim(),
      mission: mission.value.trim(),
    })

    router.push(`/admin/elections/${electionId.value}/candidates`)
  } catch {
    // apiError is managed by useCandidateAdmin
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div>
    <!-- Navigation Back Link -->
    <div class="mb-4">
      <NuxtLink
        :to="`/admin/elections/${electionId}/candidates`"
        class="text-small text-text-secondary hover:text-primary inline-flex items-center gap-1 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Kembali ke Daftar Kandidat
      </NuxtLink>
    </div>

    <!-- Error Banner -->
    <div
      v-if="pageError"
      class="mb-6 p-4 rounded-card bg-red-50 border border-red-200 text-danger text-small flex items-center justify-between"
    >
      <span>{{ pageError }}</span>
      <button @click="loadData" class="btn-secondary text-caption py-1 px-3">Coba Lagi</button>
    </div>

    <!-- Loading State -->
    <div v-if="pageLoading" class="card p-12 text-center text-text-muted">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
      <p class="text-body">Memuat data kandidat...</p>
    </div>

    <!-- Form Content -->
    <div v-else-if="election && candidate" class="max-w-3xl">
      <!-- Header -->
      <div class="mb-6 pb-6 border-b border-border">
        <div class="flex items-center gap-3">
          <h1 class="text-h2 font-bold text-text-primary">Ubah Data Paslon</h1>
          <span :class="['badge', getBadgeClass(election.computedState)]">
            {{ election.computedState }}
          </span>
        </div>
        <p class="text-small text-text-muted mt-1">
          Pemilihan: <span class="font-medium text-text-primary">{{ election.title }}</span> &bull; ID Paslon: <span class="font-mono">{{ candidate.id }}</span>
        </p>
      </div>

      <!-- Lifecycle Warning if Not Editable -->
      <div
        v-if="!isEditable"
        class="mb-6 p-4 rounded-card bg-red-50 border border-red-200 text-danger text-small"
      >
        <p class="font-semibold">Perubahan Paslon Tidak Diizinkan</p>
        <p class="mt-1">
          Pemilihan saat ini berstatus <strong>{{ election.computedState }}</strong>.
          Kandidat hanya dapat diubah pada status <strong>DRAFT</strong> atau <strong>SCHEDULED</strong>.
        </p>
      </div>

      <!-- API Error Alert -->
      <div
        v-if="apiError"
        class="mb-6 p-4 rounded-card bg-red-50 border border-red-200 text-danger text-small"
      >
        {{ apiError }}
      </div>

      <!-- Form Card -->
      <div class="card p-6">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <!-- Number -->
            <div class="sm:col-span-1">
              <label for="number" class="label">Nomor Paslon <span class="text-danger">*</span></label>
              <input
                id="number"
                v-model="number"
                type="number"
                min="1"
                step="1"
                placeholder="cth: 1"
                class="input"
                :class="{ 'border-danger focus:ring-danger': validationErrors.number }"
                :disabled="isSubmitting || !isEditable"
              />
              <p v-if="validationErrors.number" class="mt-1 text-caption text-danger">
                {{ validationErrors.number }}
              </p>
            </div>

            <!-- Name -->
            <div class="sm:col-span-2">
              <label for="name" class="label">Nama Lengkap Paslon <span class="text-danger">*</span></label>
              <input
                id="name"
                v-model="name"
                type="text"
                placeholder="cth: Budi Santoso & Siti Aminah"
                class="input"
                :class="{ 'border-danger focus:ring-danger': validationErrors.name }"
                :disabled="isSubmitting || !isEditable"
              />
              <p v-if="validationErrors.name" class="mt-1 text-caption text-danger">
                {{ validationErrors.name }}
              </p>
            </div>
          </div>

          <!-- Photo URL -->
          <div>
            <label for="photoUrl" class="label">
              URL Foto Paslon
              <span class="text-caption text-text-muted font-normal">(Opsional)</span>
            </label>
            <input
              id="photoUrl"
              v-model="photoUrl"
              type="url"
              placeholder="https://example.com/foto-paslon.jpg"
              class="input"
              :disabled="isSubmitting || !isEditable"
              @input="imagePreviewError = false"
            />
            <p class="mt-1 text-caption text-text-muted">
              Masukkan tautan langsung gambar (JPG, PNG, atau WebP).
            </p>

            <!-- Image Preview Box -->
            <div v-if="photoUrl.trim()" class="mt-3 p-3 bg-background rounded-card border border-border flex items-center gap-4">
              <div class="w-16 h-16 rounded-card overflow-hidden bg-surface border border-border flex items-center justify-center flex-shrink-0">
                <img
                  v-if="!imagePreviewError"
                  :src="photoUrl.trim()"
                  alt="Preview"
                  class="w-full h-full object-cover"
                  @error="imagePreviewError = true"
                />
                <svg v-else class="w-8 h-8 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div class="text-caption">
                <span v-if="!imagePreviewError" class="text-primary font-medium">Pratinjau Foto Valid</span>
                <span v-else class="text-danger">Gambar tidak dapat dimuat dari URL yang diberikan.</span>
              </div>
            </div>
          </div>

          <!-- Vision -->
          <div>
            <label for="vision" class="label">Visi Paslon <span class="text-danger">*</span></label>
            <textarea
              id="vision"
              v-model="vision"
              rows="3"
              placeholder="Tuliskan pernyataan visi paslon..."
              class="input"
              :class="{ 'border-danger focus:ring-danger': validationErrors.vision }"
              :disabled="isSubmitting || !isEditable"
            ></textarea>
            <p v-if="validationErrors.vision" class="mt-1 text-caption text-danger">
              {{ validationErrors.vision }}
            </p>
          </div>

          <!-- Mission -->
          <div>
            <label for="mission" class="label">Misi Paslon <span class="text-danger">*</span></label>
            <textarea
              id="mission"
              v-model="mission"
              rows="4"
              placeholder="Tuliskan poin-poin misi paslon..."
              class="input"
              :class="{ 'border-danger focus:ring-danger': validationErrors.mission }"
              :disabled="isSubmitting || !isEditable"
            ></textarea>
            <p v-if="validationErrors.mission" class="mt-1 text-caption text-danger">
              {{ validationErrors.mission }}
            </p>
          </div>

          <!-- Form Actions -->
          <div class="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <NuxtLink
              :to="`/admin/elections/${electionId}/candidates`"
              class="btn-secondary"
              :class="{ 'pointer-events-none opacity-50': isSubmitting }"
            >
              Batal
            </NuxtLink>
            <button
              type="submit"
              class="btn-primary inline-flex items-center gap-2"
              :disabled="isSubmitting || !isEditable"
            >
              <span
                v-if="isSubmitting"
                class="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"
              ></span>
              <span>{{ isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
