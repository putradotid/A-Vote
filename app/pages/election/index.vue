<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { VoterElectionItem } from '~/types'

definePageMeta({
  layout: 'voter',
  middleware: ['voter'],
})

const { fetchElections, loading, error } = useVoterElection()
const elections = ref<VoterElectionItem[]>([])

const loadData = async () => {
  elections.value = await fetchElections()
}

onMounted(() => {
  loadData()
})

const formatDate = (isoString: string | null): string => {
  if (!isoString) return '-'
  try {
    return new Date(isoString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoString
  }
}

const getBadgeClass = (state: string): string => {
  switch (state) {
    case 'ACTIVE':
      return 'badge-active'
    case 'SCHEDULED':
      return 'badge-scheduled'
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

const getBadgeLabel = (state: string): string => {
  switch (state) {
    case 'ACTIVE':
      return 'Sedang Berlangsung'
    case 'SCHEDULED':
      return 'Akan Datang'
    case 'ENDED':
      return 'Selesai (Menunggu Hasil)'
    case 'RESULT_PUBLISHED':
      return 'Hasil Diumumkan'
    case 'CANCELLED':
      return 'Dibatalkan'
    default:
      return state
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header banner -->
    <div class="bg-surface border border-border rounded-card p-6 shadow-card">
      <h1 class="text-h2 font-bold text-text-primary">Portal Pemilihan Mahasiswa</h1>
      <p class="text-text-secondary mt-1">
        Daftar pemilihan yang tersedia di Universitas Amikom Purwokerto. Pastikan Anda menggunakan hak suara Anda pada pemilihan yang sedang aktif.
      </p>
    </div>

    <!-- Error state -->
    <div v-if="error" class="bg-danger/10 text-danger p-4 rounded-card border border-danger/20 text-small">
      {{ error }}
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading && elections.length === 0" class="space-y-4">
      <div v-for="i in 3" :key="i" class="card p-6 animate-pulse">
        <div class="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div class="h-4 bg-slate-200 rounded w-2/3 mb-2"></div>
        <div class="h-4 bg-slate-200 rounded w-1/2"></div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!loading && elections.length === 0" class="card p-12 text-center text-text-muted">
      <div class="text-4xl mb-3">🗳️</div>
      <h3 class="text-h3 font-semibold text-text-primary">Tidak Ada Pemilihan Aktif</h3>
      <p class="text-small text-text-secondary mt-1">Saat ini belum ada jadwal pemilihan yang sedang berlangsung atau dijadwalkan.</p>
    </div>

    <!-- Elections List -->
    <div v-else class="grid grid-cols-1 gap-6">
      <div
        v-for="item in elections"
        :key="item.id"
        class="card p-6 transition-all duration-200 hover:shadow-card-hover"
      >
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div class="space-y-2 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <span :class="getBadgeClass(item.computedState)">
                {{ getBadgeLabel(item.computedState) }}
              </span>

              <!-- Voter Registration Status Badge -->
              <span
                v-if="item.hasVoted"
                class="badge bg-green-50 text-success border border-green-200 font-semibold"
              >
                ✓ Sudah Memilih
              </span>
              <span
                v-else-if="item.isRegistered"
                class="badge bg-blue-50 text-primary border border-blue-200 font-semibold"
              >
                Terdaftar (Belum Memilih)
              </span>
              <span
                v-else
                class="badge bg-slate-50 text-text-muted border border-border"
              >
                Tidak Terdaftar di DPT
              </span>
            </div>

            <h2 class="text-h3 font-bold text-text-primary">
              {{ item.title }}
            </h2>

            <p class="text-small text-text-secondary line-clamp-2">
              {{ item.description || 'Tidak ada deskripsi tersedia.' }}
            </p>

            <div class="text-caption text-text-muted pt-2 flex flex-wrap gap-4">
              <div>
                <span class="font-medium text-text-secondary">Mulai:</span> {{ formatDate(item.startAt) }}
              </div>
              <div>
                <span class="font-medium text-text-secondary">Selesai:</span> {{ formatDate(item.endAt) }}
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 self-stretch sm:self-start">
            <NuxtLink
              :to="`/election/candidates?electionId=${item.id}`"
              class="btn-secondary text-small text-center"
            >
              Lihat Paslon
            </NuxtLink>

            <!-- Button to vote: only if ACTIVE, registered, and NOT yet voted -->
            <NuxtLink
              v-if="item.computedState === 'ACTIVE' && item.isRegistered && !item.hasVoted"
              :to="`/election/vote?electionId=${item.id}`"
              class="btn-primary text-small text-center"
            >
              Masuk ke Bilik Suara
            </NuxtLink>

            <!-- Button to view results if RESULT_PUBLISHED -->
            <NuxtLink
              v-else-if="item.computedState === 'RESULT_PUBLISHED'"
              :to="`/election/result?electionId=${item.id}`"
              class="btn-primary text-small text-center flex items-center justify-center gap-1.5"
            >
              <span>📊</span>
              <span>Lihat Hasil</span>
            </NuxtLink>

            <div
              v-else-if="item.computedState === 'ENDED'"
              class="text-caption text-text-muted text-center sm:text-right px-2 py-1"
            >
              Menunggu Pengumuman Hasil
            </div>

            <div
              v-else-if="item.hasVoted"
              class="text-caption text-success font-medium text-center sm:text-right px-2 py-1"
            >
              Suara telah terkirim
            </div>

            <div
              v-else-if="!item.isRegistered"
              class="text-caption text-text-muted text-center sm:text-right px-2 py-1"
            >
              Bukan pemilih DPT
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
