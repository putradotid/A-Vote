<script setup lang="ts">
// Root redirect logic (stubbed for Phase 1)
// Phase 2 will implement redirecting to /login, /admin, or /election based on role
</script>

<template>
  <main class="relative overflow-hidden bg-white font-sans text-slate-900 antialiased selection:bg-purple-100 selection:text-[#582be8] min-h-screen">
    <div class="absolute -top-36 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-purple-200/40 via-violet-100/30 to-indigo-100/20 blur-3xl pointer-events-none -z-10 rounded-full"></div>
    
    <section class="pt-16 pb-6 px-4 sm:px-6 text-center max-w-5xl mx-auto">
      <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f4f0ff] border border-purple-200/80 text-[#582be8] text-xs font-semibold tracking-wide mb-6 shadow-sm">
        <span class="text-sm">✦</span>
        <span>A-Vote System</span>
        <span class="w-1.5 h-1.5 rounded-full bg-[#582be8] animate-pulse"></span>
      </div>
      
      <h1 class="text-4xl sm:text-[54px] font-extrabold text-slate-950 tracking-tight leading-[1.14] mb-4">
        Suara Anda, Masa Depan Kita.<br class="hidden sm:inline"> Pemilihan Digital Aman &amp; Transparan.
      </h1>
      
      <p class="text-base sm:text-[17px] text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed mb-8">
        Solusi e-voting modern berbasis enkripsi end-to-end untuk pemilihan organisasi, kampus, komunitas, hingga pemilihan umum dengan audit real-time.
      </p>
      
      <div class="flex flex-wrap items-center justify-center gap-3.5">
        <NuxtLink to="/login" class="inline-flex items-center gap-2 px-7 py-3.5 bg-[#582be8] hover:bg-[#471ecc] text-white font-semibold text-sm rounded-lg shadow-lg shadow-purple-600/25 transition-all duration-150 transform hover:-translate-y-0.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
          Student Login
        </NuxtLink>
        
        <NuxtLink to="/admin/login" class="inline-flex items-center gap-2 px-7 py-3.5 bg-white hover:bg-purple-50/50 text-[#582be8] font-semibold text-sm border border-purple-200 hover:border-purple-300 rounded-lg transition-all duration-150 shadow-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
          </svg>
          Admin Login
        </NuxtLink>
      </div>
    </section>
    <section class="mt-4 max-w-[1240px] mx-auto px-4 pb-20">
      <div class="bg-white rounded-2xl border border-purple-100/80 shadow-lg shadow-purple-600/5 p-6 sm:p-12 relative overflow-hidden">
        <div class="max-w-5xl mx-auto">
          <div class="text-center mb-10">
            <span class="text-xs font-semibold text-[#582be8] bg-[#f4f0ff] border border-purple-200/80 px-3.5 py-1 rounded-full uppercase tracking-wider">Alur Pemungutan Suara</span>
            <h2 class="text-2xl sm:text-3xl font-bold text-slate-900 mt-3">4 Langkah Mudah Memberikan Suara</h2>
            <p class="text-sm text-slate-500 mt-2 max-w-lg mx-auto">Praktis, aman, dan dapat diselesaikan dalam hitungan menit dari mana saja.</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            
            <div class="bg-slate-50 border border-purple-100/80 rounded-xl p-5 hover:border-purple-200 transition-all duration-200 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-4">
                  <span class="text-[11px] font-bold text-[#582be8] bg-purple-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Langkah 01</span>
                  <span class="text-xs font-semibold text-emerald-600 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Siap</span>
                </div>
                <div class="w-12 h-12 rounded-xl bg-white border border-purple-100 text-[#582be8] flex items-center justify-center text-2xl mb-3 shadow-xs">🪪</div>
                <h3 class="text-base font-bold text-slate-800 mb-1.5">Masuk &amp; Verifikasi</h3>
                <p class="text-xs text-slate-500 leading-relaxed">Verifikasi identitas resmi dengan NIK atau kode akses unik pemilih.</p>
              </div>
              <div class="mt-4 pt-3 border-t border-purple-100/80 flex items-center gap-1.5 text-[11px] font-medium text-purple-700 bg-purple-50/50 px-2.5 py-1.5 rounded-lg">
                <span>🛡️</span> Terotentikasi &amp; Sah
              </div>
            </div>
            
            <div class="bg-[#faf9ff] border-2 border-[#582be8] rounded-xl p-5 shadow-sm transition-all duration-200 flex flex-col justify-between relative">
              <div class="absolute -top-2.5 right-4 bg-[#582be8] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Tahap Ini</div>
              <div>
                <div class="flex items-center justify-between mb-4">
                  <span class="text-[11px] font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Langkah 02</span>
                </div>
                <div class="w-12 h-12 rounded-xl bg-[#582be8] text-white flex items-center justify-center text-2xl mb-3 shadow-xs">🗳️</div>
                <h3 class="text-base font-bold text-slate-800 mb-1.5">Pilih Kandidat</h3>
                <p class="text-xs text-slate-500 leading-relaxed">Tentukan pilihan calon secara langsung dan mudah.</p>
              </div>
              <div class="mt-4 pt-3 border-t border-purple-100/80 flex items-center gap-1.5 text-[11px] font-semibold text-[#582be8]">
                <span>✓ Bilik Suara Terjaga</span>
              </div>
            </div>
            
            <div class="bg-slate-50 border border-purple-100/80 rounded-xl p-5 hover:border-purple-200 transition-all duration-200 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-4">
                  <span class="text-[11px] font-bold text-[#582be8] bg-purple-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Langkah 03</span>
                  <span class="text-xs text-slate-400">Rahasia</span>
                </div>
                <div class="w-12 h-12 rounded-xl bg-white border border-purple-100 text-[#582be8] flex items-center justify-center text-2xl mb-3 shadow-xs">🔒</div>
                <h3 class="text-base font-bold text-slate-800 mb-1.5">Kirim &amp; Enkripsi</h3>
                <p class="text-xs text-slate-500 leading-relaxed">Suara otomatis dienkripsi dan dijamin kerahasiaannya tanpa jejak profil.</p>
              </div>
              <div class="mt-4 pt-3 border-t border-purple-100/80 flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg">
                <span>✓</span> Jaminan Kerahasiaan 100%
              </div>
            </div>
            
            <div class="bg-slate-50 border border-purple-100/80 rounded-xl p-5 hover:border-purple-200 transition-all duration-200 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-4">
                  <span class="text-[11px] font-bold text-[#582be8] bg-purple-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Langkah 04</span>
                  <span class="text-xs text-purple-600 font-medium">Selesai</span>
                </div>
                <div class="w-12 h-12 rounded-xl bg-white border border-purple-100 text-[#582be8] flex items-center justify-center text-2xl mb-3 shadow-xs">🧾</div>
                <h3 class="text-base font-bold text-slate-800 mb-1.5">Terima Bukti Suara</h3>
                <p class="text-xs text-slate-500 leading-relaxed">Dapatkan tanda terima digital sah sebagai bukti pemilihan.</p>
              </div>
              <div class="mt-4 pt-3 border-t border-purple-100/80 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#582be8] bg-purple-50 border border-purple-200/80 rounded-lg py-1.5">
                <span>📜</span> Unduh Bukti Suara
              </div>
            </div>
            
          </div>
          <div class="flex justify-center">
            <div class="bg-white border border-purple-200 rounded-full py-2 px-5 shadow-sm text-xs text-slate-700 flex items-center space-x-2 whitespace-nowrap">
              <span class="text-purple-600 font-semibold text-xs">✨ Proses Cepat, Rahasia, dan Sah</span>
              <span class="text-slate-400">•</span>
              <span class="font-medium text-slate-600">100% Bebas Kendala</span>
            </div>
          </div>
        </div>
      </div>
    </section>
    </main>
</template>
