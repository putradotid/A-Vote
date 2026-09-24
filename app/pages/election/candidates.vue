<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { VoterElectionItem, VoterCandidateItem } from '~/types'

definePageMeta({
  layout: 'voter',
  middleware: ['voter'],
})

const route = useRoute()
const { fetchElection, fetchCandidates, fetchElections } = useVoterElection()

const electionId = ref<string>((route.query.electionId || route.query.id) as string || '')
const election = ref<VoterElectionItem | null>(null)
const candidates = ref<VoterCandidateItem[]>([])
const loading = ref(true)
const pageError = ref<string | null>(null)

const loadData = async () => {
  loading.value = true
  pageError.value = null

  try {
    if (!electionId.value) {
      const allElections = await fetchElections()
      if (allElections.length > 0) {
        electionId.value = allElections[0]!.id
      } else {
        pageError.value = 'Tidak ada pemilihan yang tersedia.'
        loading.value = false
        return
      }
    }

    const [electionData, candidatesData] = await Promise.all([
      fetchElection(electionId.value),
      fetchCandidates(electionId.value),
    ])

    if (!electionData) {
      pageError.value = 'Pemilihan tidak ditemukan.'
    } else {
      election.value = electionData
      candidates.value = candidatesData
    }
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Gagal memuat kandidat.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="bg-surface border border-border rounded-card p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <NuxtLink to="/election" class="text-caption text-primary hover:underline flex items-center gap-1">
            ← Kembali ke Dashboard
          </NuxtLink>
        </div>
        <h1 class="text-h2 font-extrabold text-text-primary">Profil Pasangan Calon</h1>
        <p class="text-text-secondary text-small mt-0.5">{{ election?.title }}</p>
      </div>

      <div v-if="election?.computedState === 'ACTIVE' && election?.isRegistered && !election?.hasVoted">
        <NuxtLink :to="`/election/vote?electionId=${election.id}`" class="btn-primary">
          Masuk ke Bilik Suara
        </NuxtLink>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="card p-12 text-center text-text-muted">
      <div class="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
      <p class="text-body font-medium">Memuat profil kandidat...</p>
    </div>

    <!-- Error -->
    <div v-else-if="pageError" class="card p-8 text-center space-y-4">
      <p class="text-danger">{{ pageError }}</p>
      <NuxtLink to="/election" class="btn-secondary inline-flex">Kembali ke Dashboard</NuxtLink>
    </div>

    <!-- Empty candidates -->
    <div v-else-if="candidates.length === 0" class="card p-12 text-center text-text-muted">
      <p>Belum ada kandidat yang terdaftar pada pemilihan ini.</p>
    </div>

    <!-- Candidates List -->
    <div v-else class="space-y-6">
      <div
        v-for="cand in candidates"
        :key="cand.id"
        class="card p-6 sm:p-8 bg-surface shadow-card transition-all"
      >
        <div class="flex flex-col sm:flex-row gap-6">
          <!-- Paslon Number & Photo -->
          <div class="flex flex-col items-center sm:items-start shrink-0 space-y-3">
            <div class="w-14 h-14 rounded-2xl bg-primary text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
              {{ String(cand.number).padStart(2, '0') }}
            </div>

            <div class="w-40 h-48 bg-slate-100 rounded-xl overflow-hidden border border-border flex items-center justify-center">
              <img
                v-if="cand.photoUrl"
                :src="cand.photoUrl"
                :alt="cand.name"
                class="w-full h-full object-cover"
              />
              <div v-else class="text-center text-text-muted">
                <div class="text-4xl mb-1">👤</div>
                <div class="text-caption">No. {{ cand.number }}</div>
              </div>
            </div>
          </div>

          <!-- Info & Visi Misi -->
          <div class="flex-1 space-y-4">
            <div>
              <span class="text-caption font-semibold text-text-muted uppercase tracking-wider">Pasangan Calon No. {{ cand.number }}</span>
              <h2 class="text-h2 font-bold text-text-primary">{{ cand.name }}</h2>
            </div>

            <div class="space-y-4 pt-2">
              <div class="bg-slate-50 border border-slate-100 rounded-lg p-4">
                <h3 class="text-caption font-bold text-primary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <span>🎯</span> Visi
                </h3>
                <p class="text-small text-text-secondary whitespace-pre-line leading-relaxed">
                  {{ cand.vision || '-' }}
                </p>
              </div>

              <div class="bg-slate-50 border border-slate-100 rounded-lg p-4">
                <h3 class="text-caption font-bold text-primary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <span>📋</span> Misi
                </h3>
                <p class="text-small text-text-secondary whitespace-pre-line leading-relaxed">
                  {{ cand.mission || '-' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
