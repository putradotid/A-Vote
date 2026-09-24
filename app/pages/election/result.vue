<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { VoterElectionItem } from '~/types'

definePageMeta({
  layout: 'voter',
  middleware: ['voter'],
})

const route = useRoute()
const { fetchElection, fetchElections } = useVoterElection()
const { fetchResults, result, loading: resultsLoading, error: resultsError } = useResults()

const electionId = ref<string>((route.query.electionId || route.query.id) as string || '')
const election = ref<VoterElectionItem | null>(null)
const pageLoading = ref(true)
const pageError = ref<string | null>(null)

const formatDate = (isoString: string | null): string => {
  if (!isoString) return '-'
  try {
    return new Date(isoString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoString
  }
}

const loadData = async () => {
  pageLoading.value = true
  pageError.value = null

  try {
    // If no electionId in query, find the first election that is RESULT_PUBLISHED or available
    if (!electionId.value) {
      const all = await fetchElections()
      const published = all.find(e => e.computedState === 'RESULT_PUBLISHED')
      if (published) {
        electionId.value = published.id
      } else if (all.length > 0) {
        electionId.value = all[0]!.id
      } else {
        pageError.value = 'Tidak ada data pemilihan yang tersedia.'
        pageLoading.value = false
        return
      }
    }

    const electionData = await fetchElection(electionId.value)
    if (!electionData) {
      pageError.value = 'Pemilihan tidak ditemukan.'
      pageLoading.value = false
      return
    }

    election.value = electionData

    // Only fetch results if RESULT_PUBLISHED
    if (electionData.computedState === 'RESULT_PUBLISHED') {
      await fetchResults(electionId.value)
    }
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Gagal memuat data hasil pemilihan.'
  } finally {
    pageLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Back Link -->
    <div class="flex items-center justify-between">
      <NuxtLink
        to="/election"
        class="text-small text-text-secondary hover:text-primary inline-flex items-center gap-1 transition-colors"
      >
        ← Kembali ke Dashboard Pemilihan
      </NuxtLink>
    </div>

    <!-- Loading State -->
    <div v-if="pageLoading || resultsLoading" class="card p-12 text-center text-text-muted">
      <div class="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
      <p class="text-body font-medium">Memuat hasil pemilihan...</p>
    </div>

    <!-- Page Error -->
    <div v-else-if="pageError" class="card p-8 text-center space-y-4">
      <div class="text-4xl text-danger">⚠️</div>
      <h2 class="text-h3 font-bold text-text-primary">{{ pageError }}</h2>
      <NuxtLink to="/election" class="btn-primary inline-flex">
        Kembali ke Dashboard
      </NuxtLink>
    </div>

    <!-- WAITING STATE: RESULTS NOT PUBLISHED YET -->
    <div
      v-else-if="election && election.computedState !== 'RESULT_PUBLISHED'"
      class="card p-8 sm:p-12 text-center space-y-6 bg-surface shadow-card"
    >
      <div class="w-16 h-16 bg-amber-50 text-warning rounded-full flex items-center justify-center mx-auto text-3xl">
        ⏳
      </div>

      <div class="space-y-2">
        <span class="badge bg-amber-50 text-warning border border-amber-200 font-semibold px-3 py-1">
          Hasil Belum Diumumkan
        </span>
        <h1 class="text-h2 font-extrabold text-text-primary">
          {{ election.title }}
        </h1>
        <p class="text-text-secondary max-w-lg mx-auto text-body leading-relaxed">
          Hasil perolehan suara untuk pemilihan ini belum dipublikasikan oleh panitia pemilihan. Rekapitulasi suara akan terbuka secara otomatis begitu waktu pengumuman resmi tiba.
        </p>
      </div>

      <!-- Schedule notice box -->
      <div class="bg-slate-50 border border-border rounded-xl p-5 max-w-md mx-auto text-left space-y-2 text-small">
        <div class="font-bold text-text-primary flex items-center gap-2">
          <span>📅</span> Jadwal Pengumuman Resmi:
        </div>
        <div class="text-primary font-semibold text-body pl-6">
          {{ formatDate(election.resultPublishedAt) }}
        </div>
        <p class="text-caption text-text-muted pl-6">
          Silakan kembali ke halaman ini setelah jadwal pengumuman di atas.
        </p>
      </div>

      <div class="pt-2">
        <NuxtLink to="/election" class="btn-secondary inline-flex px-6">
          Kembali ke Dashboard Pemilihan
        </NuxtLink>
      </div>
    </div>

    <!-- PUBLISHED RESULTS STATE -->
    <div v-else-if="result" class="space-y-6">
      <!-- Header Banner -->
      <div class="bg-surface border border-border rounded-card p-6 shadow-card space-y-2">
        <div class="flex items-center gap-2">
          <span class="badge-result-published font-semibold px-3 py-1">
            ✓ Hasil Resmi Diumumkan
          </span>
          <span class="text-caption text-text-muted">Universitas Amikom Purwokerto</span>
        </div>
        <h1 class="text-h2 font-extrabold text-text-primary">
          {{ result.electionTitle }}
        </h1>
        <p class="text-small text-text-secondary">
          Tabulasi hasil pemungutan suara elektronik yang telah diverifikasi secara transparan dan akuntabel.
        </p>
      </div>

      <!-- Result fetch error if any -->
      <div v-if="resultsError" class="p-4 bg-red-50 text-danger rounded-card border border-red-200 text-small">
        {{ resultsError }}
      </div>

      <!-- Participation Summary Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="card p-5 bg-surface shadow-card">
          <span class="text-caption font-semibold text-text-muted uppercase tracking-wider">Total Suara Sah Masuk</span>
          <div class="text-2xl font-extrabold text-primary mt-1">
            {{ result.totalVotes.toLocaleString('id-ID') }}
          </div>
          <span class="text-caption text-text-muted mt-1">Surat suara elektronik</span>
        </div>

        <div class="card p-5 bg-surface shadow-card">
          <span class="text-caption font-semibold text-text-muted uppercase tracking-wider">Total Pemilih Tetap (DPT)</span>
          <div class="text-2xl font-extrabold text-text-primary mt-1">
            {{ result.totalEligibleVoters.toLocaleString('id-ID') }}
          </div>
          <span class="text-caption text-text-muted mt-1">Mahasiswa berhak suara</span>
        </div>

        <div class="card p-5 bg-surface shadow-card">
          <span class="text-caption font-semibold text-text-muted uppercase tracking-wider">Tingkat Partisipasi</span>
          <div class="text-2xl font-extrabold text-success mt-1">
            {{ (result.participationRate * 100).toFixed(1) }}%
          </div>
          <span class="text-caption text-text-muted mt-1">Kehadiran pemilih</span>
        </div>
      </div>

      <!-- Candidate Results Grid -->
      <div class="card p-6 sm:p-8 bg-surface shadow-card space-y-6">
        <h3 class="text-h3 font-bold text-text-primary border-b border-border pb-3">
          Rekapitulasi Suara Pasangan Calon
        </h3>

        <!-- Zero votes notice -->
        <div v-if="result.totalVotes === 0" class="p-6 text-center text-text-muted bg-slate-50 rounded-lg">
          <p class="font-medium">Tidak ada suara yang masuk selama masa pemilihan berlangsung.</p>
        </div>

        <!-- Candidate Rows -->
        <div v-else class="space-y-6">
          <div
            v-for="cand in result.results"
            :key="cand.candidateId"
            class="p-5 rounded-2xl border border-border bg-slate-50/60 hover:bg-slate-50 transition-colors space-y-4"
          >
            <div class="flex items-center justify-between gap-4 flex-wrap">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-primary text-white font-extrabold flex items-center justify-center text-xl shadow-sm">
                  {{ String(cand.candidateNumber).padStart(2, '0') }}
                </div>
                <div>
                  <div class="text-caption font-bold text-text-muted uppercase tracking-wider">
                    Paslon No. {{ cand.candidateNumber }}
                  </div>
                  <h4 class="text-h3 font-bold text-text-primary leading-tight">
                    {{ cand.candidateName }}
                  </h4>
                </div>
              </div>

              <div class="text-right">
                <div class="text-2xl sm:text-3xl font-extrabold text-primary">
                  {{ (cand.percentage * 100).toFixed(1) }}%
                </div>
                <div class="text-small text-text-muted font-medium">
                  {{ cand.voteCount.toLocaleString('id-ID') }} suara
                </div>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="w-full bg-slate-200 rounded-full h-3.5 overflow-hidden">
              <div
                class="bg-primary h-3.5 rounded-full transition-all duration-700 ease-out"
                :style="{ width: `${cand.percentage * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Security & Transparency Notice -->
      <div class="p-4 bg-slate-50 border border-border rounded-card text-caption text-text-muted flex items-start gap-2.5">
        <span class="text-base leading-none">🛡️</span>
        <div>
          <strong>Transparansi &amp; Integritas Pemilu:</strong> Data hasil dihitung langsung dari surat suara elektronik anonim yang tercatat di basis data terdistribusi tanpa perantara. Kerahasiaan pilihan pemilih tetap terjaga sepenuhnya.
        </div>
      </div>

      <!-- Back button -->
      <div class="text-center pt-2">
        <NuxtLink to="/election" class="btn-secondary px-6">
          Kembali ke Dashboard Pemilihan
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
