<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { ElectionListItem, ElectionState } from '~/types'

definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

const { fetchElections, loading } = useElectionAdmin()
const elections = ref<ElectionListItem[]>([])

onMounted(async () => {
  try {
    elections.value = await fetchElections()
  } catch {
    // handled gracefully
  }
})

const totalElections = computed(() => elections.value.length)
const activeElections = computed(
  () => elections.value.filter(e => e.computedState === 'ACTIVE').length,
)
const recentElections = computed(() => elections.value.slice(0, 5))

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
</script>

<template>
  <div>
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div>
        <h1 class="text-h2 font-bold text-text-primary">Admin Dashboard</h1>
        <p class="text-small text-text-muted mt-1">Ringkasan status platform e-voting A-Vote.</p>
      </div>
      <NuxtLink to="/admin/elections/create" class="btn-primary">
        + Buat Pemilihan
      </NuxtLink>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
      <div class="card p-6">
        <h3 class="text-small font-semibold uppercase tracking-wider text-text-muted mb-2">Total Pemilihan</h3>
        <p class="text-4xl font-bold text-primary">{{ loading ? '...' : totalElections }}</p>
      </div>
      <div class="card p-6">
        <h3 class="text-small font-semibold uppercase tracking-wider text-text-muted mb-2">Pemilihan Aktif</h3>
        <p class="text-4xl font-bold text-success">{{ loading ? '...' : activeElections }}</p>
      </div>
      <div class="card p-6">
        <h3 class="text-small font-semibold uppercase tracking-wider text-text-muted mb-2">Total Pemilih Terdaftar</h3>
        <p class="text-4xl font-bold text-info">0</p>
        <span class="text-caption text-text-muted">Fase 5</span>
      </div>
    </div>

    <!-- Recent Elections -->
    <div class="card overflow-hidden">
      <div class="p-6 border-b border-border flex justify-between items-center">
        <h2 class="text-h3 font-semibold text-text-primary">Pemilihan Terbaru</h2>
        <NuxtLink to="/admin/elections" class="text-small text-primary hover:underline font-medium">
          Lihat Semua &rarr;
        </NuxtLink>
      </div>

      <div v-if="loading" class="p-8 text-center text-text-muted">
        <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-2"></div>
        <p class="text-small">Memuat data pemilihan...</p>
      </div>

      <div v-else-if="recentElections.length === 0" class="p-8 text-center text-text-muted">
        <p class="text-body mb-3">Belum ada agenda pemilihan yang dibuat.</p>
        <NuxtLink to="/admin/elections/create" class="btn-primary text-small">
          Mulai Buat Pemilihan
        </NuxtLink>
      </div>

      <div v-else class="divide-y divide-border">
        <div
          v-for="item in recentElections"
          :key="item.id"
          class="p-4 sm:px-6 flex items-center justify-between hover:bg-background/50 transition-colors"
        >
          <div>
            <NuxtLink :to="`/admin/elections/${item.id}`" class="font-semibold text-text-primary hover:text-primary transition-colors">
              {{ item.title }}
            </NuxtLink>
            <p class="text-caption text-text-muted line-clamp-1 mt-0.5">{{ item.description }}</p>
          </div>
          <div class="flex items-center gap-3">
            <span :class="['badge', getBadgeClass(item.computedState)]">
              {{ item.computedState }}
            </span>
            <NuxtLink :to="`/admin/elections/${item.id}`" class="btn-secondary text-caption py-1 px-2">
              Buka
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
