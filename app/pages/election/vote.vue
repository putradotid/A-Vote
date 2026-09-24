<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { VoterElectionItem, VoterCandidateItem } from '~/types'

definePageMeta({
  layout: 'voter',
  middleware: ['voter'],
})

const route = useRoute()
const router = useRouter()
const { fetchElection, fetchCandidates, fetchElections } = useVoterElection()
const { submitVote, isSubmitting, errorMsg: voteError, isSuccess, resetVotingState } = useVoting()

const electionId = ref<string>((route.query.electionId || route.query.id) as string || '')
const election = ref<VoterElectionItem | null>(null)
const candidates = ref<VoterCandidateItem[]>([])
const loading = ref(true)
const pageError = ref<string | null>(null)

// Candidate selection state
const selectedCandidateId = ref<string | null>(null)
const showConfirmModal = ref(false)
const expandedVisiMisi = ref<Record<string, boolean>>({})

const selectedCandidate = computed(() => {
  return candidates.value.find(c => c.id === selectedCandidateId.value) || null
})

const loadData = async () => {
  loading.value = true
  pageError.value = null
  resetVotingState()

  try {
    // If no electionId provided in query, find the first ACTIVE election
    if (!electionId.value) {
      const allElections = await fetchElections()
      const active = allElections.find(e => e.computedState === 'ACTIVE' && e.isRegistered && !e.hasVoted)
      if (active) {
        electionId.value = active.id
      } else if (allElections.length > 0) {
        electionId.value = allElections[0]!.id
      } else {
        pageError.value = 'Tidak ada pemilihan yang tersedia saat ini.'
        loading.value = false
        return
      }
    }

    const [electionData, candidatesData] = await Promise.all([
      fetchElection(electionId.value),
      fetchCandidates(electionId.value),
    ])

    if (!electionData) {
      pageError.value = 'Pemilihan tidak ditemukan atau belum dipublikasikan.'
    } else {
      election.value = electionData
      candidates.value = candidatesData
    }
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Gagal memuat data bilik suara.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

const selectCandidate = (cid: string) => {
  if (election.value?.computedState !== 'ACTIVE' || election.value?.hasVoted || isSuccess.value) {
    return
  }
  selectedCandidateId.value = cid
}

const toggleVisiMisi = (cid: string, ev: MouseEvent) => {
  ev.stopPropagation()
  expandedVisiMisi.value[cid] = !expandedVisiMisi.value[cid]
}

const openConfirmModal = () => {
  if (!selectedCandidateId.value) return
  showConfirmModal.value = true
}

const closeConfirmModal = () => {
  if (isSubmitting.value) return
  showConfirmModal.value = false
}

const handleConfirmVote = async () => {
  if (!election.value || !selectedCandidateId.value) return

  const result = await submitVote(election.value.id, selectedCandidateId.value)
  if (result.success) {
    showConfirmModal.value = false
    if (election.value) {
      election.value.hasVoted = true
    }
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Loading state -->
    <div v-if="loading" class="card p-12 text-center text-text-muted">
      <div class="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
      <p class="text-body font-medium">Memuat data bilik suara...</p>
    </div>

    <!-- Page error state -->
    <div v-else-if="pageError" class="card p-8 text-center space-y-4">
      <div class="text-4xl text-danger">⚠️</div>
      <h2 class="text-h3 font-bold text-text-primary">{{ pageError }}</h2>
      <NuxtLink to="/election" class="btn-primary inline-flex">
        Kembali ke Dashboard Pemilihan
      </NuxtLink>
    </div>

    <!-- SUCCESS STATE (POST-VOTE) -->
    <div v-else-if="isSuccess" class="card p-8 sm:p-12 text-center space-y-6 bg-surface shadow-card">
      <div class="w-20 h-20 bg-green-100 text-success rounded-full flex items-center justify-center mx-auto text-4xl shadow-sm">
        ✓
      </div>

      <div class="space-y-2">
        <span class="badge bg-green-50 text-success border border-green-200 uppercase tracking-wider text-caption font-semibold px-3 py-1">
          Suara Sah Tercatat
        </span>
        <h1 class="text-h2 font-extrabold text-text-primary">
          Terima Kasih! Suara Anda Telah Berhasil Terkirim.
        </h1>
        <p class="text-text-secondary max-w-lg mx-auto text-body leading-relaxed">
          Hak suara Anda pada pemilihan <strong>{{ election?.title }}</strong> telah berhasil diproses secara aman dan rahasia. Pilihan Anda dienkripsi secara independen dan tidak terhubung dengan identitas Anda.
        </p>
      </div>

      <div class="bg-slate-50 border border-border rounded-card p-4 max-w-md mx-auto text-left text-small text-text-secondary space-y-1">
        <div class="flex items-center gap-2 text-text-primary font-medium">
          <span>🛡️</span> Jaminan Kerahasiaan (Secret Ballot)
        </div>
        <p class="text-caption text-text-muted">
          Sesuai prinsip kerahasiaan pemilu, pilihan paslon Anda telah dipisahkan secara permanen dari akun mahasiswa Anda.
        </p>
      </div>

      <div class="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
        <NuxtLink to="/election" class="btn-primary w-full sm:w-auto px-6">
          Kembali ke Dashboard Pemilihan
        </NuxtLink>
      </div>
    </div>

    <!-- ALREADY VOTED STATE -->
    <div v-else-if="election?.hasVoted" class="card p-8 sm:p-12 text-center space-y-6 bg-surface shadow-card">
      <div class="w-16 h-16 bg-blue-50 text-primary rounded-full flex items-center justify-center mx-auto text-3xl">
        🗳️
      </div>

      <div class="space-y-2">
        <span class="badge bg-green-50 text-success border border-green-200 font-semibold px-3 py-1">
          ✓ Anda Sudah Memilih
        </span>
        <h1 class="text-h2 font-bold text-text-primary">
          Anda Telah Memberikan Hak Suara
        </h1>
        <p class="text-text-secondary max-w-lg mx-auto text-body">
          Anda sudah berpartisipasi dalam pemilihan <strong>{{ election?.title }}</strong>. Setiap pemilih hanya berhak memberikan 1 (satu) suara pada satu pemilihan.
        </p>
      </div>

      <div class="pt-2">
        <NuxtLink to="/election" class="btn-primary inline-flex px-6">
          Kembali ke Dashboard Pemilihan
        </NuxtLink>
      </div>
    </div>

    <!-- NOT REGISTERED STATE -->
    <div v-else-if="!election?.isRegistered" class="card p-8 sm:p-12 text-center space-y-6 bg-surface shadow-card">
      <div class="w-16 h-16 bg-amber-50 text-warning rounded-full flex items-center justify-center mx-auto text-3xl">
        🚫
      </div>

      <div class="space-y-2">
        <span class="badge bg-amber-50 text-warning border border-amber-200 font-semibold px-3 py-1">
          Tidak Terdaftar
        </span>
        <h1 class="text-h2 font-bold text-text-primary">
          Anda Tidak Terdaftar dalam DPT
        </h1>
        <p class="text-text-secondary max-w-lg mx-auto text-body">
          Akun Anda tidak terdaftar sebagai pemilih tetap pada pemilihan <strong>{{ election?.title }}</strong>. Silakan hubungi panitia pemilihan jika Anda merasa seharusnya terdaftar.
        </p>
      </div>

      <div class="pt-2">
        <NuxtLink to="/election" class="btn-secondary inline-flex px-6">
          Kembali ke Dashboard Pemilihan
        </NuxtLink>
      </div>
    </div>

    <!-- NOT ACTIVE STATE -->
    <div v-else-if="election?.computedState !== 'ACTIVE'" class="card p-8 sm:p-12 text-center space-y-6 bg-surface shadow-card">
      <div class="w-16 h-16 bg-slate-100 text-text-secondary rounded-full flex items-center justify-center mx-auto text-3xl">
        ⏳
      </div>

      <div class="space-y-2">
        <span class="badge bg-amber-50 text-warning border border-amber-200 font-semibold px-3 py-1">
          Status: {{ election?.computedState }}
        </span>
        <h1 class="text-h2 font-bold text-text-primary">
          Bilik Suara Sedang Ditutup
        </h1>
        <p v-if="election?.computedState === 'SCHEDULED'" class="text-text-secondary max-w-lg mx-auto text-body">
          Pemilihan ini belum dibuka. Voting akan dibuka pada jadwal yang telah ditentukan panitia.
        </p>
        <p v-else-if="election?.computedState === 'ENDED' || election?.computedState === 'RESULT_PUBLISHED'" class="text-text-secondary max-w-lg mx-auto text-body">
          Masa pemungutan suara untuk pemilihan ini telah berakhir.
        </p>
        <p v-else-if="election?.computedState === 'CANCELLED'" class="text-danger max-w-lg mx-auto text-body">
          Pemilihan ini telah dibatalkan oleh panitia pemilihan.
        </p>
      </div>

      <div class="pt-2">
        <NuxtLink to="/election" class="btn-secondary inline-flex px-6">
          Kembali ke Dashboard Pemilihan
        </NuxtLink>
      </div>
    </div>

    <!-- ACTIVE BALLOT FORM -->
    <div v-else class="space-y-8 pb-24">
      <!-- Election header banner -->
      <div class="bg-surface border border-border rounded-card p-6 shadow-card">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span class="badge-active">Sedang Berlangsung (ACTIVE)</span>
          <span class="text-caption text-text-muted">Hak Suara: 1 Kali</span>
        </div>
        <h1 class="text-h2 font-extrabold text-text-primary">{{ election?.title }}</h1>
        <p class="text-text-secondary text-small mt-1">
          Silakan tentukan pilihan Anda dengan memilih salah satu pasangan calon di bawah ini, kemudian klik tombol <strong>Lanjutkan ke Konfirmasi</strong>.
        </p>
      </div>

      <!-- Submission error notice if any -->
      <div v-if="voteError" class="bg-danger/10 text-danger p-4 rounded-card border border-danger/20 text-small">
        <strong>Gagal memberikan suara:</strong> {{ voteError }}
      </div>

      <!-- Candidate list empty -->
      <div v-if="candidates.length === 0" class="card p-8 text-center text-text-muted">
        <p>Belum ada pasangan calon yang terdaftar untuk pemilihan ini.</p>
      </div>

      <!-- Candidates Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          v-for="cand in candidates"
          :key="cand.id"
          @click="selectCandidate(cand.id)"
          :class="[
            'card transition-all duration-200 cursor-pointer overflow-hidden relative border-2 flex flex-col justify-between',
            selectedCandidateId === cand.id
              ? 'border-primary ring-2 ring-primary/20 bg-blue-50/20 shadow-card-hover'
              : 'border-border hover:border-slate-300 hover:shadow-card'
          ]"
        >
          <!-- Selected check badge -->
          <div
            v-if="selectedCandidateId === cand.id"
            class="absolute top-4 right-4 bg-primary text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm shadow-md z-10"
          >
            ✓
          </div>

          <div class="p-6">
            <!-- Header: Paslon Number Badge -->
            <div class="flex items-center gap-3 mb-4">
              <div class="w-12 h-12 rounded-xl bg-primary text-white font-extrabold text-xl flex items-center justify-center shadow-sm">
                {{ String(cand.number).padStart(2, '0') }}
              </div>
              <div>
                <span class="text-caption font-semibold text-text-muted uppercase tracking-wider">Pasangan Calon</span>
                <h3 class="text-h3 font-bold text-text-primary leading-tight">{{ cand.name }}</h3>
              </div>
            </div>

            <!-- Candidate Photo -->
            <div class="w-full h-48 bg-slate-100 rounded-lg overflow-hidden border border-border mb-4 flex items-center justify-center">
              <img
                v-if="cand.photoUrl"
                :src="cand.photoUrl"
                :alt="cand.name"
                class="w-full h-full object-cover"
              />
              <div v-else class="text-center text-text-muted">
                <div class="text-4xl mb-1">👤</div>
                <div class="text-caption">Foto Paslon No. {{ cand.number }}</div>
              </div>
            </div>

            <!-- Visi & Misi Accordion -->
            <div class="space-y-3">
              <button
                type="button"
                @click="toggleVisiMisi(cand.id, $event)"
                class="text-small font-medium text-primary hover:underline flex items-center justify-between w-full pt-1"
              >
                <span>Lihat Visi &amp; Misi</span>
                <span>{{ expandedVisiMisi[cand.id] ? '▲' : '▼' }}</span>
              </button>

              <div v-if="expandedVisiMisi[cand.id]" class="space-y-3 pt-2 text-small border-t border-border">
                <div>
                  <h4 class="font-bold text-text-primary text-caption uppercase tracking-wider mb-1">Visi</h4>
                  <p class="text-text-secondary whitespace-pre-line bg-slate-50 p-2.5 rounded border border-slate-100 text-caption">
                    {{ cand.vision || '-' }}
                  </p>
                </div>
                <div>
                  <h4 class="font-bold text-text-primary text-caption uppercase tracking-wider mb-1">Misi</h4>
                  <p class="text-text-secondary whitespace-pre-line bg-slate-50 p-2.5 rounded border border-slate-100 text-caption">
                    {{ cand.mission || '-' }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Selection status footer in card -->
          <div class="p-4 bg-slate-50 border-t border-border flex items-center justify-between text-small">
            <span v-if="selectedCandidateId === cand.id" class="text-primary font-bold flex items-center gap-1.5">
              <span>●</span> Pilihan Anda
            </span>
            <span v-else class="text-text-muted">
              Klik kartu untuk memilih
            </span>

            <button
              type="button"
              @click.stop="selectCandidate(cand.id)"
              :class="selectedCandidateId === cand.id ? 'btn-primary py-1 px-3 text-caption' : 'btn-secondary py-1 px-3 text-caption'"
            >
              {{ selectedCandidateId === cand.id ? 'Terpilih' : 'Pilih Paslon' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Sticky / Bottom Action Bar -->
      <div class="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur border-t border-border shadow-lg p-4 z-20">
        <div class="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div class="text-center sm:text-left">
            <div class="text-caption text-text-muted">Pilihan Saat Ini:</div>
            <div v-if="selectedCandidate" class="text-body font-bold text-text-primary">
              Paslon No. {{ selectedCandidate.number }} — {{ selectedCandidate.name }}
            </div>
            <div v-else class="text-body font-medium text-text-secondary italic">
              Belum ada pasangan calon yang dipilih
            </div>
          </div>

          <div class="flex items-center gap-3 w-full sm:w-auto">
            <NuxtLink to="/election" class="btn-secondary flex-1 sm:flex-none">
              Batal
            </NuxtLink>
            <button
              type="button"
              @click="openConfirmModal"
              :disabled="!selectedCandidateId"
              class="btn-primary flex-1 sm:flex-none px-6"
            >
              Lanjutkan ke Konfirmasi
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL KONFIRMASI SUARA -->
    <div
      v-if="showConfirmModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs"
    >
      <div class="card bg-surface w-full max-w-md p-6 rounded-card shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div class="text-center space-y-2">
          <div class="w-12 h-12 rounded-full bg-blue-50 text-primary flex items-center justify-center mx-auto text-2xl font-bold">
            ?
          </div>
          <h3 class="text-h3 font-bold text-text-primary">Konfirmasi Pilihan Suara</h3>
          <p class="text-caption text-text-secondary">
            Periksa kembali pilihan Anda sebelum mengirimkan suara ke sistem pemilihan.
          </p>
        </div>

        <!-- Selected Candidate Summary in Modal -->
        <div v-if="selectedCandidate" class="bg-blue-50/50 border border-blue-200/80 rounded-xl p-4 text-center space-y-2">
          <div class="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-white font-extrabold text-lg">
            {{ String(selectedCandidate.number).padStart(2, '0') }}
          </div>
          <div>
            <div class="text-caption text-primary font-bold uppercase tracking-wider">Pasangan Calon Terpilih</div>
            <div class="text-h3 font-extrabold text-text-primary">{{ selectedCandidate.name }}</div>
          </div>
        </div>

        <div class="bg-amber-50 border border-amber-200/80 rounded-lg p-3 text-caption text-warning flex items-start gap-2">
          <span class="text-base leading-none">⚠️</span>
          <span>
            <strong>Penting:</strong> Setelah Anda menekan tombol "Ya, Kirim Suara", suara Anda akan disimpan secara permanen dan tidak dapat diubah atau ditarik kembali.
          </span>
        </div>

        <div v-if="voteError" class="bg-danger/10 text-danger p-3 rounded-lg border border-danger/20 text-caption">
          {{ voteError }}
        </div>

        <!-- Modal Actions -->
        <div class="flex items-center gap-3 pt-2">
          <button
            type="button"
            @click="closeConfirmModal"
            :disabled="isSubmitting"
            class="btn-secondary flex-1"
          >
            Periksa Kembali
          </button>
          <button
            type="button"
            @click="handleConfirmVote"
            :disabled="isSubmitting"
            class="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <span v-if="isSubmitting" class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
            <span>{{ isSubmitting ? 'Mengirim Suara...' : 'Ya, Kirim Suara' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
