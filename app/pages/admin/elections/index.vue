<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { ElectionListItem, ElectionState } from '~/types'

definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

const { fetchElections, deleteElection, loading, error } = useElectionAdmin()

const elections = ref<ElectionListItem[]>([])
const searchQuery = ref('')
const selectedStatus = ref<string>('ALL')
const deleteTarget = ref<ElectionListItem | null>(null)
const isDeleting = ref(false)
const deleteError = ref<string | null>(null)

const loadData = async () => {
  try {
    elections.value = await fetchElections()
  } catch {
    // error is captured in composable
  }
}

onMounted(() => {
  loadData()
})

// Filtered elections
const filteredElections = computed(() => {
  return elections.value.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesStatus =
      selectedStatus.value === 'ALL' || item.computedState === selectedStatus.value

    return matchesSearch && matchesStatus
  })
})

const formatDateTime = (isoString: string | null): string => {
  if (!isoString) return 'Belum diatur'
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
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

const confirmDelete = (election: ElectionListItem) => {
  deleteTarget.value = election
  deleteError.value = null
}

const cancelDelete = () => {
  deleteTarget.value = null
  deleteError.value = null
}

const handleDelete = async () => {
  if (!deleteTarget.value) return
  isDeleting.value = true
  deleteError.value = null
  try {
    await deleteElection(deleteTarget.value.id)
    elections.value = elections.value.filter(e => e.id !== deleteTarget.value?.id)
    deleteTarget.value = null
  } catch (err: unknown) {
    deleteError.value = err instanceof Error ? err.message : 'Gagal menghapus pemilihan.'
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div>
        <h1 class="text-h2 font-bold text-text-primary">Daftar Pemilihan</h1>
        <p class="text-small text-text-muted mt-1">Kelola dan pantau seluruh agenda pemilihan di A-Vote.</p>
      </div>
      <NuxtLink to="/admin/elections/create" class="btn-primary">
        <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Buat Pemilihan
      </NuxtLink>
    </div>

    <!-- Filters & Search -->
    <div class="card p-4 mb-6 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
      <div class="relative flex-1">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari pemilihan berdasarkan judul atau deskripsi..."
          class="input pl-10"
        />
        <svg
          class="w-5 h-5 text-text-muted absolute left-3 top-2.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-small text-text-secondary whitespace-nowrap">Filter Status:</span>
        <select v-model="selectedStatus" class="input py-2">
          <option value="ALL">Semua Status</option>
          <option value="DRAFT">Draft</option>
          <option value="SCHEDULED">Terjadwal</option>
          <option value="ACTIVE">Sedang Berlangsung</option>
          <option value="ENDED">Selesai</option>
          <option value="RESULT_PUBLISHED">Hasil Diumumkan</option>
          <option value="CANCELLED">Dibatalkan</option>
        </select>
      </div>
    </div>

    <!-- Error Banner -->
    <div v-if="error" class="mb-6 p-4 rounded-card bg-red-50 border border-red-200 text-danger flex items-center justify-between">
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <span>{{ error }}</span>
      </div>
      <button @click="loadData" class="btn-secondary text-caption py-1 px-3">Coba Lagi</button>
    </div>

    <!-- Loading State -->
    <div v-if="loading && elections.length === 0" class="card p-12 text-center text-text-muted">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
      <p class="text-body">Memuat daftar pemilihan...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredElections.length === 0" class="card p-12 text-center">
      <div class="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 text-text-muted">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <h3 class="text-h3 font-semibold text-text-primary mb-1">
        {{ searchQuery || selectedStatus !== 'ALL' ? 'Tidak ada pemilihan yang cocok' : 'Belum Ada Pemilihan' }}
      </h3>
      <p class="text-small text-text-muted max-w-md mx-auto mb-6">
        {{ searchQuery || selectedStatus !== 'ALL'
          ? 'Coba ubah kata kunci pencarian atau filter status untuk menemukan pemilihan.'
          : 'Buat agenda pemilihan pertama Anda sekarang untuk memulai proses e-voting.' }}
      </p>
      <NuxtLink v-if="!searchQuery && selectedStatus === 'ALL'" to="/admin/elections/create" class="btn-primary">
        + Buat Pemilihan Pertama
      </NuxtLink>
    </div>

    <!-- Elections Table / Cards -->
    <div v-else class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-border bg-background/50 text-text-secondary text-caption font-semibold uppercase tracking-wider">
              <th class="py-3.5 px-6">Pemilihan</th>
              <th class="py-3.5 px-6">Status</th>
              <th class="py-3.5 px-6">Jadwal Voting</th>
              <th class="py-3.5 px-6">Dibuat Pada</th>
              <th class="py-3.5 px-6 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border text-body">
            <tr
              v-for="item in filteredElections"
              :key="item.id"
              class="hover:bg-background/40 transition-colors"
            >
              <!-- Title & Description -->
              <td class="py-4 px-6 max-w-xs">
                <NuxtLink :to="`/admin/elections/${item.id}`" class="font-semibold text-primary hover:underline block truncate">
                  {{ item.title }}
                </NuxtLink>
                <p class="text-caption text-text-muted line-clamp-1 mt-0.5">{{ item.description }}</p>
              </td>

              <!-- Status Badge -->
              <td class="py-4 px-6 whitespace-nowrap">
                <span :class="['badge', getBadgeClass(item.computedState)]">
                  {{ item.computedState }}
                </span>
              </td>

              <!-- Schedule -->
              <td class="py-4 px-6 text-small text-text-secondary whitespace-nowrap">
                <div v-if="item.startAt && item.endAt">
                  <div class="font-medium text-text-primary">{{ formatDateTime(item.startAt) }}</div>
                  <div class="text-caption text-text-muted">s/d {{ formatDateTime(item.endAt) }}</div>
                </div>
                <span v-else class="text-caption text-text-muted italic">Belum dijadwalkan</span>
              </td>

              <!-- Created At -->
              <td class="py-4 px-6 text-small text-text-muted whitespace-nowrap">
                {{ formatDateTime(item.createdAt) }}
              </td>

              <!-- Actions -->
              <td class="py-4 px-6 text-right whitespace-nowrap">
                <div class="flex items-center justify-end gap-2">
                  <NuxtLink
                    :to="`/admin/elections/${item.id}`"
                    class="btn-secondary text-caption py-1 px-2.5"
                  >
                    Detail
                  </NuxtLink>
                  <NuxtLink
                    v-if="item.computedState !== 'CANCELLED'"
                    :to="`/admin/elections/${item.id}/edit`"
                    class="btn-secondary text-caption py-1 px-2.5"
                  >
                    Edit
                  </NuxtLink>
                  <button
                    v-if="item.computedState === 'DRAFT' || item.computedState === 'CANCELLED'"
                    @click="confirmDelete(item)"
                    class="text-danger hover:bg-red-50 p-1.5 rounded-button transition-colors"
                    title="Hapus Pemilihan"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="deleteTarget"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
    >
      <div class="card p-6 w-full max-w-md bg-surface shadow-lg">
        <div class="flex items-center gap-3 mb-4 text-danger">
          <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 class="text-h3 font-bold text-text-primary">Hapus Pemilihan?</h3>
            <p class="text-small text-text-muted">Tindakan ini tidak dapat dibatalkan.</p>
          </div>
        </div>

        <p class="text-body text-text-secondary mb-4">
          Apakah Anda yakin ingin menghapus pemilihan
          <strong class="text-text-primary">"{{ deleteTarget.title }}"</strong>?
        </p>

        <div v-if="deleteError" class="mb-4 p-3 bg-red-50 border border-red-200 rounded text-danger text-small">
          {{ deleteError }}
        </div>

        <div class="flex justify-end gap-3">
          <button
            type="button"
            @click="cancelDelete"
            :disabled="isDeleting"
            class="btn-secondary"
          >
            Batal
          </button>
          <button
            type="button"
            @click="handleDelete"
            :disabled="isDeleting"
            class="btn-danger"
          >
            <span v-if="isDeleting" class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
            {{ isDeleting ? 'Menghapus...' : 'Ya, Hapus' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
