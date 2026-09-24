<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { ElectionListItem, VoterListItem, ElectionState } from '~/types'

definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

const route = useRoute()
const electionId = computed(() => route.params.id as string)

const { fetchElection } = useElectionAdmin()
const { fetchVoters, addVoter, removeVoter } = useVoterAdmin()

const election = ref<ElectionListItem | null>(null)
const voters = ref<VoterListItem[]>([])
const totalCount = ref(0)
const votedCount = ref(0)
const loading = ref(true)
const pageError = ref<string | null>(null)

// Search
const searchQuery = ref('')

// Add voter modal
const showAddModal = ref(false)
const nimInput = ref('')
const addLoading = ref(false)
const addError = ref<string | null>(null)

// Delete modal
const voterToDelete = ref<VoterListItem | null>(null)
const isDeleting = ref(false)
const deleteError = ref<string | null>(null)

const isEditable = computed(() => {
  const state = election.value?.computedState
  return state === 'DRAFT' || state === 'SCHEDULED'
})

const notVotedCount = computed(() => totalCount.value - votedCount.value)

const filteredVoters = computed(() => {
  if (!searchQuery.value.trim()) return voters.value
  const query = searchQuery.value.trim().toLowerCase()
  return voters.value.filter(
    (v) =>
      v.nim.toLowerCase().includes(query) ||
      v.name.toLowerCase().includes(query),
  )
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
    const [elecData, voterData] = await Promise.all([
      fetchElection(electionId.value),
      fetchVoters(electionId.value),
    ])
    election.value = elecData
    voters.value = voterData.voters
    totalCount.value = voterData.totalCount
    votedCount.value = voterData.votedCount
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Gagal memuat data pemilih.'
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  nimInput.value = ''
  addError.value = null
  showAddModal.value = true
}

const handleAddVoter = async () => {
  const trimmedNim = nimInput.value.trim()
  if (!trimmedNim) {
    addError.value = 'NIM wajib diisi.'
    return
  }
  if (trimmedNim.length < 4) {
    addError.value = 'NIM minimal 4 karakter.'
    return
  }

  addLoading.value = true
  addError.value = null
  try {
    const newVoter = await addVoter(electionId.value, { nim: trimmedNim })
    voters.value = [newVoter, ...voters.value]
    totalCount.value += 1
    nimInput.value = ''
    showAddModal.value = false
  } catch (err: unknown) {
    addError.value = err instanceof Error ? err.message : 'Gagal menambahkan pemilih.'
  } finally {
    addLoading.value = false
  }
}

const confirmDelete = (voter: VoterListItem) => {
  if (!isEditable.value) return
  voterToDelete.value = voter
  deleteError.value = null
}

const handleDelete = async () => {
  if (!voterToDelete.value) return
  isDeleting.value = true
  deleteError.value = null
  try {
    await removeVoter(electionId.value, voterToDelete.value.id)
    if (voterToDelete.value.hasVoted) {
      votedCount.value -= 1
    }
    voters.value = voters.value.filter((v) => v.id !== voterToDelete.value?.id)
    totalCount.value -= 1
    voterToDelete.value = null
  } catch (err: unknown) {
    deleteError.value = err instanceof Error ? err.message : 'Gagal menghapus pemilih.'
  } finally {
    isDeleting.value = false
  }
}

const formatDate = (isoString: string): string => {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(isoString))
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
      <p class="text-body">Memuat daftar pemilih...</p>
    </div>

    <!-- Content -->
    <div v-else-if="election">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-border">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-h2 font-bold text-text-primary">Daftar Pemilih Tetap (DPT)</h1>
            <span :class="['badge', getBadgeClass(election.computedState)]">
              {{ election.computedState }}
            </span>
          </div>
          <p class="text-small text-text-muted mt-1">
            Pemilihan: <span class="font-medium text-text-primary">{{ election.title }}</span>
          </p>
        </div>

        <div>
          <button
            v-if="isEditable"
            @click="openAddModal"
            class="btn-primary inline-flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Tambah Pemilih
          </button>
          <div
            v-else
            class="text-caption text-text-muted bg-background px-3 py-1.5 rounded border border-border"
          >
            DPT Terkunci
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div class="card p-4 text-center">
          <div class="text-caption uppercase tracking-wider font-semibold text-text-muted mb-1">Total DPT</div>
          <div class="text-h2 font-bold text-primary">{{ totalCount }}</div>
        </div>
        <div class="card p-4 text-center">
          <div class="text-caption uppercase tracking-wider font-semibold text-text-muted mb-1">Sudah Memilih</div>
          <div class="text-h2 font-bold text-success">{{ votedCount }}</div>
        </div>
        <div class="card p-4 text-center">
          <div class="text-caption uppercase tracking-wider font-semibold text-text-muted mb-1">Belum Memilih</div>
          <div class="text-h2 font-bold text-text-secondary">{{ notVotedCount }}</div>
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
          <p class="font-semibold">Perubahan DPT Tidak Diizinkan</p>
          <p class="mt-0.5 text-text-secondary">
            Pemilihan saat ini berada dalam status <strong>{{ election.computedState }}</strong>.
            Penambahan dan penghapusan pemilih hanya dapat dilakukan pada status <strong>DRAFT</strong> atau <strong>SCHEDULED</strong>.
          </p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="voters.length === 0" class="card p-12 text-center">
        <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 class="text-h3 font-semibold text-text-primary mb-2">Belum Ada Pemilih Terdaftar</h3>
        <p class="text-body text-text-muted mb-6 max-w-md mx-auto">
          Belum ada mahasiswa yang didaftarkan sebagai pemilih dalam DPT pemilihan ini.
        </p>
        <button
          v-if="isEditable"
          @click="openAddModal"
          class="btn-primary inline-flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Daftarkan Pemilih Pertama
        </button>
      </div>

      <!-- Voter Table -->
      <div v-else class="card overflow-hidden">
        <!-- Search Bar -->
        <div class="p-4 border-b border-border">
          <div class="relative max-w-sm">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari berdasarkan NIM atau Nama..."
              class="input pl-10"
            />
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-small">
            <thead>
              <tr class="bg-background border-b border-border">
                <th class="text-left px-4 py-3 font-semibold text-text-muted uppercase tracking-wider text-caption">No.</th>
                <th class="text-left px-4 py-3 font-semibold text-text-muted uppercase tracking-wider text-caption">NIM</th>
                <th class="text-left px-4 py-3 font-semibold text-text-muted uppercase tracking-wider text-caption">Nama Mahasiswa</th>
                <th class="text-left px-4 py-3 font-semibold text-text-muted uppercase tracking-wider text-caption">Status</th>
                <th class="text-left px-4 py-3 font-semibold text-text-muted uppercase tracking-wider text-caption">Terdaftar</th>
                <th v-if="isEditable" class="text-right px-4 py-3 font-semibold text-text-muted uppercase tracking-wider text-caption">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(voter, index) in filteredVoters"
                :key="voter.id"
                class="border-b border-border/60 hover:bg-background/50 transition-colors"
              >
                <td class="px-4 py-3 text-text-muted">{{ index + 1 }}</td>
                <td class="px-4 py-3 font-mono text-text-primary font-medium">{{ voter.nim }}</td>
                <td class="px-4 py-3 text-text-primary">{{ voter.name }}</td>
                <td class="px-4 py-3">
                  <span
                    v-if="voter.hasVoted"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-caption font-semibold bg-green-100 text-success"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Sudah Memilih
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-caption font-semibold bg-slate-100 text-text-muted"
                  >
                    Belum Memilih
                  </span>
                </td>
                <td class="px-4 py-3 text-text-muted text-caption">{{ formatDate(voter.createdAt) }}</td>
                <td v-if="isEditable" class="px-4 py-3 text-right">
                  <button
                    @click="confirmDelete(voter)"
                    class="p-1.5 rounded hover:bg-red-50 text-text-muted hover:text-danger transition-colors"
                    title="Hapus dari DPT"
                    :disabled="voter.hasVoted"
                    :class="{ 'opacity-30 cursor-not-allowed': voter.hasVoted }"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Search Empty State -->
        <div
          v-if="searchQuery.trim() && filteredVoters.length === 0"
          class="p-8 text-center text-text-muted"
        >
          <p class="text-body">Tidak ditemukan pemilih dengan kata kunci "<strong>{{ searchQuery }}</strong>".</p>
        </div>

        <!-- Footer Info -->
        <div class="p-4 border-t border-border bg-background text-caption text-text-muted flex justify-between items-center">
          <span>Menampilkan {{ filteredVoters.length }} dari {{ voters.length }} pemilih</span>
        </div>
      </div>
    </div>

    <!-- Add Voter Modal -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
    >
      <div class="card p-6 w-full max-w-md bg-surface shadow-lg">
        <h3 class="text-h3 font-bold text-text-primary mb-2">Tambah Pemilih ke DPT</h3>
        <p class="text-small text-text-secondary mb-4">
          Masukkan NIM mahasiswa yang akan didaftarkan sebagai pemilih dalam pemilihan ini.
        </p>

        <div v-if="addError" class="mb-4 p-3 bg-red-50 border border-red-200 rounded text-danger text-small">
          {{ addError }}
        </div>

        <form @submit.prevent="handleAddVoter">
          <div class="mb-4">
            <label for="nim-input" class="label">NIM Mahasiswa <span class="text-danger">*</span></label>
            <input
              id="nim-input"
              v-model="nimInput"
              type="text"
              placeholder="cth: 20260001"
              class="input"
              :disabled="addLoading"
              autofocus
            />
            <p class="mt-1 text-caption text-text-muted">
              Mahasiswa harus sudah terdaftar dalam sistem sebagai akun voter.
            </p>
          </div>

          <div class="flex justify-end gap-3">
            <button
              type="button"
              @click="showAddModal = false"
              class="btn-secondary"
              :disabled="addLoading"
            >
              Batal
            </button>
            <button
              type="submit"
              class="btn-primary inline-flex items-center gap-2"
              :disabled="addLoading"
            >
              <span
                v-if="addLoading"
                class="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"
              ></span>
              <span>{{ addLoading ? 'Mendaftarkan...' : 'Daftarkan Pemilih' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="voterToDelete"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
    >
      <div class="card p-6 w-full max-w-md bg-surface shadow-lg">
        <h3 class="text-h3 font-bold text-text-primary mb-2">Hapus Pemilih dari DPT?</h3>
        <p class="text-body text-text-secondary mb-4">
          Apakah Anda yakin ingin menghapus <strong>{{ voterToDelete.name }}</strong> (NIM: <strong>{{ voterToDelete.nim }}</strong>) dari Daftar Pemilih Tetap? Tindakan ini tidak dapat dibatalkan.
        </p>

        <div v-if="deleteError" class="mb-4 p-3 bg-red-50 border border-red-200 rounded text-danger text-small">
          {{ deleteError }}
        </div>

        <div class="flex justify-end gap-3">
          <button
            type="button"
            @click="voterToDelete = null"
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
            <span>{{ isDeleting ? 'Menghapus...' : 'Hapus dari DPT' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
