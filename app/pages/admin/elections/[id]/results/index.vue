<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

const route = useRoute()
const electionId = String(route.params.id)

const { fetchResults, publishResults, result, loading, error } = useResults()

const showPublishModal = ref(false)
const isPublishing = ref(false)
const publishError = ref<string | null>(null)

const loadData = async () => {
  await fetchResults(electionId)
}

onMounted(() => {
  loadData()
})

const getBadgeClass = (state: string) => {
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

const getBadgeLabel = (state: string) => {
  switch (state) {
    case 'ACTIVE':
      return 'Sedang Berlangsung'
    case 'SCHEDULED':
      return 'Akan Datang'
    case 'ENDED':
      return 'Selesai (Menunggu Publikasi)'
    case 'RESULT_PUBLISHED':
      return 'Hasil Dipublikasikan'
    case 'CANCELLED':
      return 'Dibatalkan'
    default:
      return state
  }
}

const handleConfirmPublish = async () => {
  isPublishing.value = true
  publishError.value = null

  const res = await publishResults(electionId)
  if (res.success) {
    showPublishModal.value = false
  } else {
    publishError.value = res.error || 'Gagal mempublikasikan hasil.'
  }
  isPublishing.value = false
}
</script>

<template>
  <div>
    <!-- Back Link -->
    <div class="mb-4">
      <NuxtLink
        :to="`/admin/elections/${electionId}`"
        class="text-small text-text-secondary hover:text-primary inline-flex items-center gap-1 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Kembali ke Rincian Pemilihan
      </NuxtLink>
    </div>

    <!-- Error Banner -->
    <div
      v-if="error"
      class="mb-6 p-4 rounded-card bg-red-50 border border-red-200 text-danger text-small flex items-center justify-between"
    >
      <span>{{ error }}</span>
      <button @click="loadData" class="btn-secondary text-caption py-1 px-3">Coba Lagi</button>
    </div>

    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-border">
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-h2 font-bold text-text-primary">
            {{ result?.electionTitle || 'Hasil Pemilihan' }}
          </h1>
          <span v-if="result" :class="['badge', getBadgeClass(result.computedState)]">
            {{ getBadgeLabel(result.computedState) }}
          </span>
        </div>
        <p class="text-small text-text-muted mt-1 font-mono">ID: {{ electionId }}</p>
      </div>

      <!-- Action Button if ENDED -->
      <div v-if="result?.computedState === 'ENDED'" class="flex items-center gap-3">
        <button
          @click="showPublishModal = true"
          class="btn-primary flex items-center gap-2"
        >
          <span>📢</span>
          <span>Publikasikan Hasil Sekarang</span>
        </button>
      </div>
    </div>

    <!-- Sub Navigation -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="md:col-span-1 space-y-1">
        <NuxtLink
          :to="`/admin/elections/${electionId}`"
          class="block px-3 py-2.5 rounded-button text-small font-medium text-text-secondary hover:bg-background transition-colors"
        >
          Ringkasan
        </NuxtLink>
        <NuxtLink
          :to="`/admin/elections/${electionId}/candidates`"
          class="block px-3 py-2.5 rounded-button text-small font-medium text-text-secondary hover:bg-background transition-colors"
        >
          Kandidat
        </NuxtLink>
        <NuxtLink
          :to="`/admin/elections/${electionId}/voters`"
          class="block px-3 py-2.5 rounded-button text-small font-medium text-text-secondary hover:bg-background transition-colors"
        >
          Daftar Pemilih
        </NuxtLink>
        <NuxtLink
          :to="`/admin/elections/${electionId}/results`"
          class="block px-3 py-2.5 rounded-button text-small font-semibold bg-primary/10 text-primary"
        >
          Hasil Pemilihan
        </NuxtLink>
      </div>

      <!-- Content Area -->
      <div class="md:col-span-3 space-y-6">
        <!-- Loading State -->
        <div v-if="loading && !result" class="card p-12 text-center text-text-muted">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
          <p class="text-body font-medium">Memuat dan menghitung rekapitulasi hasil suara...</p>
        </div>

        <div v-else-if="result" class="space-y-6">
          <!-- Status Banners -->
          <div
            v-if="result.computedState === 'ACTIVE'"
            class="p-4 bg-green-50 border border-green-200 rounded-card text-small text-green-800 flex items-start gap-2.5"
          >
            <span class="text-base leading-none">🟢</span>
            <div>
              <strong>Voting Sedang Berlangsung:</strong> Data di bawah adalah rekapitulasi real-time untuk pemantauan internal panitia. Mahasiswa belum dapat melihat hasil ini sampai pemilihan berakhir dan dipublikasikan.
            </div>
          </div>

          <div
            v-else-if="result.computedState === 'ENDED'"
            class="p-4 bg-amber-50 border border-amber-200 rounded-card text-small text-amber-800 flex items-start gap-2.5"
          >
            <span class="text-base leading-none">⏳</span>
            <div>
              <strong>Masa Pemungutan Suara Berakhir:</strong> Hasil belum dipublikasikan ke publik. Silakan periksa rekapitulasi di bawah, lalu klik tombol <strong>"Publikasikan Hasil Sekarang"</strong> untuk membuka hasil bagi seluruh mahasiswa.
            </div>
          </div>

          <div
            v-else-if="result.computedState === 'RESULT_PUBLISHED'"
            class="p-4 bg-sky-50 border border-sky-200 rounded-card text-small text-sky-800 flex items-start gap-2.5"
          >
            <span class="text-base leading-none">✓</span>
            <div>
              <strong>Hasil Resmi Telah Dipublikasikan:</strong> Rekapitulasi suara saat ini bersifat terbuka dan dapat diakses oleh seluruh mahasiswa di portal pemilih.
            </div>
          </div>

          <!-- Stats Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="card p-5 bg-surface">
              <span class="text-caption font-semibold text-text-muted uppercase tracking-wider">Total Suara Masuk</span>
              <div class="text-2xl font-extrabold text-primary mt-1">{{ result.totalVotes.toLocaleString('id-ID') }}</div>
              <span class="text-caption text-text-muted mt-1">Surat suara sah</span>
            </div>

            <div class="card p-5 bg-surface">
              <span class="text-caption font-semibold text-text-muted uppercase tracking-wider">Total DPT</span>
              <div class="text-2xl font-extrabold text-text-primary mt-1">{{ result.totalEligibleVoters.toLocaleString('id-ID') }}</div>
              <span class="text-caption text-text-muted mt-1">Pemilih terdaftar</span>
            </div>

            <div class="card p-5 bg-surface">
              <span class="text-caption font-semibold text-text-muted uppercase tracking-wider">Tingkat Partisipasi</span>
              <div class="text-2xl font-extrabold text-success mt-1">{{ (result.participationRate * 100).toFixed(1) }}%</div>
              <span class="text-caption text-text-muted mt-1">Dari total pemilih tetap</span>
            </div>
          </div>

          <!-- Candidate Results Tally -->
          <div class="card p-6 bg-surface shadow-card space-y-6">
            <h3 class="text-h3 font-bold text-text-primary border-b border-border pb-3">
              Perolehan Suara Pasangan Calon
            </h3>

            <!-- Zero votes notice -->
            <div v-if="result.totalVotes === 0" class="p-6 text-center text-text-muted bg-slate-50 rounded-lg">
              <p class="font-medium">Belum ada suara yang masuk untuk pemilihan ini.</p>
              <p class="text-caption text-text-muted mt-1">Hasil akan otomatis terakumulasi begitu pemilih memberikan suara.</p>
            </div>

            <!-- Candidate rows -->
            <div v-else class="space-y-6">
              <div
                v-for="cand in result.results"
                :key="cand.candidateId"
                class="p-4 rounded-xl border border-border bg-slate-50/50 space-y-3"
              >
                <div class="flex items-center justify-between gap-4 flex-wrap">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-primary text-white font-extrabold flex items-center justify-center text-lg">
                      {{ String(cand.candidateNumber).padStart(2, '0') }}
                    </div>
                    <div>
                      <div class="text-caption font-semibold text-text-muted uppercase tracking-wider">Paslon No. {{ cand.candidateNumber }}</div>
                      <div class="text-body font-bold text-text-primary">{{ cand.candidateName }}</div>
                    </div>
                  </div>

                  <div class="text-right">
                    <div class="text-h3 font-extrabold text-primary">
                      {{ (cand.percentage * 100).toFixed(1) }}%
                    </div>
                    <div class="text-caption text-text-muted">
                      {{ cand.voteCount.toLocaleString('id-ID') }} suara
                    </div>
                  </div>
                </div>

                <!-- Progress Bar -->
                <div class="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    class="bg-primary h-3 rounded-full transition-all duration-500"
                    :style="{ width: `${cand.percentage * 100}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL KONFIRMASI PUBLIKASI -->
    <div
      v-if="showPublishModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs"
    >
      <div class="card bg-surface w-full max-w-md p-6 rounded-card shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div class="text-center space-y-2">
          <div class="w-12 h-12 rounded-full bg-blue-50 text-primary flex items-center justify-center mx-auto text-2xl font-bold">
            📢
          </div>
          <h3 class="text-h3 font-bold text-text-primary">Publikasikan Hasil Pemilihan?</h3>
          <p class="text-caption text-text-secondary leading-relaxed">
            Apakah Anda yakin ingin mempublikasikan hasil pemilihan ini sekarang? Setelah dipublikasikan, hasil rekapitulasi akan langsung dapat dilihat secara terbuka oleh seluruh mahasiswa.
          </p>
        </div>

        <div v-if="publishError" class="p-3 bg-red-50 text-danger rounded-lg border border-red-200 text-caption">
          {{ publishError }}
        </div>

        <div class="flex items-center gap-3 pt-2">
          <button
            type="button"
            @click="showPublishModal = false"
            :disabled="isPublishing"
            class="btn-secondary flex-1"
          >
            Batal
          </button>
          <button
            type="button"
            @click="handleConfirmPublish"
            :disabled="isPublishing"
            class="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <span v-if="isPublishing" class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
            <span>{{ isPublishing ? 'Mempublikasikan...' : 'Ya, Publikasikan' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
