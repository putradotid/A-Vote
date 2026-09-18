<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { ElectionListItem, ElectionState } from '~/types'

definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

const route = useRoute()
const router = useRouter()
const electionId = computed(() => route.params.id as string)

const {
  fetchElection,
  cancelElection,
  deleteElection,
  loading,
  error,
} = useElectionAdmin()

const election = ref<ElectionListItem | null>(null)
const actionError = ref<string | null>(null)
const isActionLoading = ref(false)

// Modals
const showCancelModal = ref(false)
const showDeleteModal = ref(false)

const loadElection = async () => {
  try {
    election.value = await fetchElection(electionId.value)
  } catch {
    // error handled in composable
  }
}

onMounted(() => {
  loadElection()
})

const formatDateTime = (isoString: string | null): string => {
  if (!isoString) return 'Belum diatur'
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(isoString))
}

const getBadgeClass = (state: ElectionState): string => {
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
      return 'badge-result-published'
    case 'CANCELLED':
      return 'badge-cancelled'
    default:
      return 'badge-draft'
  }
}

const handleCancelElection = async () => {
  if (!election.value) return
  isActionLoading.value = true
  actionError.value = null
  try {
    const updated = await cancelElection(election.value.id)
    election.value = updated
    showCancelModal.value = false
  } catch (err: unknown) {
    actionError.value = err instanceof Error ? err.message : 'Gagal membatalkan pemilihan.'
  } finally {
    isActionLoading.value = false
  }
}

const handleDeleteElection = async () => {
  if (!election.value) return
  isActionLoading.value = true
  actionError.value = null
  try {
    await deleteElection(election.value.id)
    showDeleteModal.value = false
    router.push('/admin/elections')
  } catch (err: unknown) {
    actionError.value = err instanceof Error ? err.message : 'Gagal menghapus pemilihan.'
  } finally {
    isActionLoading.value = false
  }
}
</script>

<template>
  <div>
    <!-- Back Link -->
    <div class="mb-4">
      <NuxtLink
        to="/admin/elections"
        class="text-small text-text-secondary hover:text-primary inline-flex items-center gap-1 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Kembali ke Daftar Pemilihan
      </NuxtLink>
    </div>

    <!-- Error Banner -->
    <div
      v-if="error"
      class="mb-6 p-4 rounded-card bg-red-50 border border-red-200 text-danger text-small flex items-center justify-between"
    >
      <span>{{ error }}</span>
      <button @click="loadElection" class="btn-secondary text-caption py-1 px-3">Coba Lagi</button>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !election" class="card p-12 text-center text-text-muted">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
      <p class="text-body">Memuat rincian pemilihan...</p>
    </div>

    <!-- Detail Content -->
    <div v-else-if="election">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-border">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-h2 font-bold text-text-primary">{{ election.title }}</h1>
            <span :class="['badge', getBadgeClass(election.computedState)]">
              {{ election.computedState }}
            </span>
          </div>
          <p class="text-small text-text-muted mt-1 font-mono">ID: {{ election.id }}</p>
        </div>

        <!-- Header Actions -->
        <div class="flex items-center gap-2 flex-wrap">
          <NuxtLink
            v-if="election.computedState !== 'CANCELLED'"
            :to="`/admin/elections/${election.id}/edit`"
            class="btn-secondary"
          >
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Pemilihan
          </NuxtLink>
          <button
            v-if="election.computedState === 'DRAFT' || election.computedState === 'SCHEDULED'"
            @click="showCancelModal = true"
            class="btn-secondary text-danger hover:bg-red-50"
          >
            Batalkan
          </button>
          <button
            v-if="election.computedState === 'DRAFT' || election.computedState === 'CANCELLED'"
            @click="showDeleteModal = true"
            class="btn-danger"
          >
            Hapus
          </button>
        </div>
      </div>

      <!-- Main Layout with Sub-navigation -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <!-- Sub Navigation -->
        <div class="md:col-span-1 space-y-1">
          <NuxtLink
            :to="`/admin/elections/${election.id}`"
            class="block px-3 py-2.5 rounded-button text-small font-semibold bg-primary/10 text-primary"
          >
            Ringkasan
          </NuxtLink>
          <NuxtLink
            :to="`/admin/elections/${election.id}/candidates`"
            class="block px-3 py-2.5 rounded-button text-small font-medium text-text-secondary hover:bg-background transition-colors flex justify-between items-center"
          >
            <span>Kandidat</span>
            <span class="text-caption px-1.5 py-0.5 bg-background border border-border rounded text-text-muted">Fase 4</span>
          </NuxtLink>
          <NuxtLink
            :to="`/admin/elections/${election.id}/voters`"
            class="block px-3 py-2.5 rounded-button text-small font-medium text-text-secondary hover:bg-background transition-colors flex justify-between items-center"
          >
            <span>Daftar Pemilih</span>
            <span class="text-caption px-1.5 py-0.5 bg-background border border-border rounded text-text-muted">Fase 5</span>
          </NuxtLink>
          <NuxtLink
            :to="`/admin/elections/${election.id}/results`"
            class="block px-3 py-2.5 rounded-button text-small font-medium text-text-secondary hover:bg-background transition-colors flex justify-between items-center"
          >
            <span>Hasil Suara</span>
            <span class="text-caption px-1.5 py-0.5 bg-background border border-border rounded text-text-muted">Fase 6</span>
          </NuxtLink>
        </div>

        <!-- Content Area -->
        <div class="md:col-span-3 space-y-6">
          <!-- Overview Card -->
          <div class="card p-6">
            <h2 class="text-h3 font-semibold text-text-primary mb-3">Deskripsi Pemilihan</h2>
            <p class="text-body text-text-secondary whitespace-pre-line leading-relaxed">
              {{ election.description }}
            </p>
          </div>

          <!-- Schedule Timeline Card -->
          <div class="card p-6">
            <h2 class="text-h3 font-semibold text-text-primary mb-4">Jadwal & Waktu Pelaksanaan</h2>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="p-4 rounded-card bg-background border border-border">
                <div class="text-caption uppercase tracking-wider font-semibold text-text-muted mb-1">Mulai Voting</div>
                <div class="text-small font-medium text-text-primary">
                  {{ formatDateTime(election.startAt) }}
                </div>
              </div>

              <div class="p-4 rounded-card bg-background border border-border">
                <div class="text-caption uppercase tracking-wider font-semibold text-text-muted mb-1">Selesai Voting</div>
                <div class="text-small font-medium text-text-primary">
                  {{ formatDateTime(election.endAt) }}
                </div>
              </div>

              <div class="p-4 rounded-card bg-background border border-border">
                <div class="text-caption uppercase tracking-wider font-semibold text-text-muted mb-1">Pengumuman Hasil</div>
                <div class="text-small font-medium text-text-primary">
                  {{ formatDateTime(election.resultPublishedAt) }}
                </div>
              </div>
            </div>

            <div v-if="!election.startAt" class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-warning text-small">
              Jadwal belum ditentukan. Pemilihan berada dalam status <strong>DRAFT</strong>. Silakan klik "Edit Pemilihan" untuk menjadwalkan.
            </div>
          </div>

          <!-- Metadata Card -->
          <div class="card p-6">
            <h2 class="text-h3 font-semibold text-text-primary mb-4">Informasi Sistem</h2>
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-small">
              <div>
                <dt class="text-text-muted">Dibuat Oleh:</dt>
                <dd class="font-mono text-text-secondary mt-0.5">{{ election.createdBy }}</dd>
              </div>
              <div>
                <dt class="text-text-muted">Tanggal Pembuatan:</dt>
                <dd class="text-text-secondary mt-0.5">{{ formatDateTime(election.createdAt) }}</dd>
              </div>
              <div>
                <dt class="text-text-muted">Status Firestore:</dt>
                <dd class="font-mono text-text-secondary mt-0.5">{{ election.status }}</dd>
              </div>
              <div>
                <dt class="text-text-muted">Status Efektif (Server Computed):</dt>
                <dd class="font-bold text-primary mt-0.5">{{ election.computedState }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>

    <!-- Cancel Modal -->
    <div
      v-if="showCancelModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
    >
      <div class="card p-6 w-full max-w-md bg-surface shadow-lg">
        <h3 class="text-h3 font-bold text-text-primary mb-2">Batalkan Pemilihan?</h3>
        <p class="text-body text-text-secondary mb-4">
          Pemilihan yang dibatalkan tidak akan dapat dibuka kembali untuk pemungutan suara. Apakah Anda yakin?
        </p>

        <div v-if="actionError" class="mb-4 p-3 bg-red-50 border border-red-200 rounded text-danger text-small">
          {{ actionError }}
        </div>

        <div class="flex justify-end gap-3">
          <button
            type="button"
            @click="showCancelModal = false"
            :disabled="isActionLoading"
            class="btn-secondary"
          >
            Kembali
          </button>
          <button
            type="button"
            @click="handleCancelElection"
            :disabled="isActionLoading"
            class="btn-danger"
          >
            <span v-if="isActionLoading" class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
            {{ isActionLoading ? 'Memproses...' : 'Ya, Batalkan' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
    >
      <div class="card p-6 w-full max-w-md bg-surface shadow-lg">
        <h3 class="text-h3 font-bold text-danger mb-2">Hapus Pemilihan?</h3>
        <p class="text-body text-text-secondary mb-4">
          Data pemilihan ini akan dihapus secara permanen dari sistem. Tindakan ini tidak dapat dibatalkan.
        </p>

        <div v-if="actionError" class="mb-4 p-3 bg-red-50 border border-red-200 rounded text-danger text-small">
          {{ actionError }}
        </div>

        <div class="flex justify-end gap-3">
          <button
            type="button"
            @click="showDeleteModal = false"
            :disabled="isActionLoading"
            class="btn-secondary"
          >
            Batal
          </button>
          <button
            type="button"
            @click="handleDeleteElection"
            :disabled="isActionLoading"
            class="btn-danger"
          >
            <span v-if="isActionLoading" class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
            {{ isActionLoading ? 'Menghapus...' : 'Hapus Permanen' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
