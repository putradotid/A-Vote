<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { ElectionListItem, CandidateListItem, ElectionState } from '~/types'

definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

const route = useRoute()
const electionId = computed(() => route.params.id as string)

const { fetchElection } = useElectionAdmin()
const { fetchCandidates, deleteCandidate } = useCandidateAdmin()

const election = ref<ElectionListItem | null>(null)
const candidates = ref<CandidateListItem[]>([])
const loading = ref(true)
const pageError = ref<string | null>(null)

// Delete modal state
const candidateToDelete = ref<CandidateListItem | null>(null)
const isDeleting = ref(false)
const deleteError = ref<string | null>(null)

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
  loading.value = true
  pageError.value = null
  try {
    const [elecData, candsData] = await Promise.all([
      fetchElection(electionId.value),
      fetchCandidates(electionId.value),
    ])
    election.value = elecData
    candidates.value = candsData
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Gagal memuat data kandidat.'
  } finally {
    loading.value = false
  }
}

const confirmDelete = (cand: CandidateListItem) => {
  if (!isEditable.value) return
  candidateToDelete.value = cand
  deleteError.value = null
}

const handleDelete = async () => {
  if (!candidateToDelete.value) return
  isDeleting.value = true
  deleteError.value = null
  try {
    await deleteCandidate(electionId.value, candidateToDelete.value.id)
    candidates.value = candidates.value.filter((c) => c.id !== candidateToDelete.value?.id)
    candidateToDelete.value = null
  } catch (err: unknown) {
    deleteError.value = err instanceof Error ? err.message : 'Gagal menghapus kandidat.'
  } finally {
    isDeleting.value = false
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
        :to="`/admin/elections/${electionId}`"
        class="text-small text-text-secondary hover:text-primary inline-flex items-center gap-1 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Kembali ke Ringkasan Pemilihan
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
    <div v-if="loading" class="card p-12 text-center text-text-muted">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
      <p class="text-body">Memuat daftar kandidat...</p>
    </div>

    <!-- Content -->
    <div v-else-if="election">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-border">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-h2 font-bold text-text-primary">Daftar Kandidat</h1>
            <span :class="['badge', getBadgeClass(election.computedState)]">
              {{ election.computedState }}
            </span>
          </div>
          <p class="text-small text-text-muted mt-1">
            Pemilihan: <span class="font-medium text-text-primary">{{ election.title }}</span>
          </p>
        </div>

        <div>
          <NuxtLink
            v-if="isEditable"
            :to="`/admin/elections/${electionId}/candidates/create`"
            class="btn-primary inline-flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Tambah Paslon
          </NuxtLink>
          <div
            v-else
            class="text-caption text-text-muted bg-background px-3 py-1.5 rounded border border-border"
          >
            Kandidat Terkunci
          </div>
        </div>
      </div>

      <!-- Lifecycle Warning Banner if Not Editable -->
      <div
        v-if="!isEditable"
        class="mb-6 p-4 rounded-card bg-amber-50 border border-amber-200 text-warning text-small flex items-start gap-3"
      >
        <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <p class="font-semibold">Perubahan Kandidat Tidak Diizinkan</p>
          <p class="mt-0.5 text-text-secondary">
            Pemilihan saat ini berada dalam status <strong>{{ election.computedState }}</strong>.
            Penambahan, pengubahan, dan penghapusan kandidat hanya dapat dilakukan pada status <strong>DRAFT</strong> atau <strong>SCHEDULED</strong>.
          </p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="candidates.length === 0" class="card p-12 text-center">
        <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 class="text-h3 font-semibold text-text-primary mb-2">Belum Ada Paslon Terdaftar</h3>
        <p class="text-body text-text-muted mb-6 max-w-md mx-auto">
          Belum ada pasangan calon atau kandidat yang didaftarkan untuk pemilihan ini.
        </p>
        <NuxtLink
          v-if="isEditable"
          :to="`/admin/elections/${electionId}/candidates/create`"
          class="btn-primary inline-flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Daftarkan Paslon Pertama
        </NuxtLink>
      </div>

      <!-- Candidates Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="cand in candidates"
          :key="cand.id"
          class="card p-6 flex flex-col justify-between hover:border-primary/50 transition-all duration-200 group relative shadow-sm hover:shadow"
        >
          <!-- Candidate Header -->
          <div>
            <div class="flex items-start justify-between gap-2 mb-4">
              <!-- Number Badge -->
              <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold text-h3 shadow-sm">
                {{ cand.number }}
              </span>

              <!-- Action Buttons -->
              <div v-if="isEditable" class="flex items-center gap-1">
                <NuxtLink
                  :to="`/admin/elections/${electionId}/candidates/${cand.id}`"
                  class="p-1.5 rounded hover:bg-background text-text-muted hover:text-primary transition-colors"
                  title="Edit Paslon"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </NuxtLink>
                <button
                  @click="confirmDelete(cand)"
                  class="p-1.5 rounded hover:bg-red-50 text-text-muted hover:text-danger transition-colors"
                  title="Hapus Paslon"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Candidate Image or Fallback -->
            <div class="w-full h-44 bg-background rounded-card overflow-hidden mb-4 border border-border flex items-center justify-center relative">
              <img
                v-if="cand.photoUrl"
                :src="cand.photoUrl"
                :alt="cand.name"
                class="w-full h-full object-cover"
                @error="cand.photoUrl = null"
              />
              <div v-else class="flex flex-col items-center justify-center text-text-muted p-4 text-center">
                <svg class="w-12 h-12 text-slate-300 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span class="text-caption">Foto belum diatur</span>
              </div>
            </div>

            <!-- Name -->
            <h2 class="text-h3 font-bold text-text-primary mb-3">{{ cand.name }}</h2>

            <!-- Vision -->
            <div class="mb-3">
              <div class="text-caption font-semibold uppercase tracking-wider text-text-muted mb-1">Visi</div>
              <p class="text-small text-text-secondary line-clamp-3 leading-relaxed whitespace-pre-line">
                {{ cand.vision }}
              </p>
            </div>

            <!-- Mission -->
            <div class="mb-4">
              <div class="text-caption font-semibold uppercase tracking-wider text-text-muted mb-1">Misi</div>
              <p class="text-small text-text-secondary line-clamp-4 leading-relaxed whitespace-pre-line">
                {{ cand.mission }}
              </p>
            </div>
          </div>

          <!-- Card Footer Info -->
          <div class="pt-3 border-t border-border/60 flex items-center justify-between text-caption text-text-muted">
            <span>Paslon #{{ cand.number }}</span>
            <NuxtLink
              v-if="isEditable"
              :to="`/admin/elections/${electionId}/candidates/${cand.id}`"
              class="text-primary hover:underline font-medium"
            >
              Ubah Data &rarr;
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="candidateToDelete"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
    >
      <div class="card p-6 w-full max-w-md bg-surface shadow-lg">
        <h3 class="text-h3 font-bold text-text-primary mb-2">Hapus Paslon?</h3>
        <p class="text-body text-text-secondary mb-4">
          Apakah Anda yakin ingin menghapus kandidat <strong>Nomor {{ candidateToDelete.number }} - {{ candidateToDelete.name }}</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>

        <div v-if="deleteError" class="mb-4 p-3 bg-red-50 border border-red-200 rounded text-danger text-small">
          {{ deleteError }}
        </div>

        <div class="flex justify-end gap-3">
          <button
            type="button"
            @click="candidateToDelete = null"
            class="btn-secondary"
            :disabled="isDeleting"
          >
            Batal
          </button>
          <button
            type="button"
            @click="handleDelete"
            class="btn-danger inline-flex items-center gap-2"
            :disabled="isDeleting"
          >
            <span
              v-if="isDeleting"
              class="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"
            ></span>
            <span>{{ isDeleting ? 'Menghapus...' : 'Hapus Paslon' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
