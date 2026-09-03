// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/google-fonts',
  ],

  devtools: { enabled: true },
  compatibilityDate: '2024-04-03',

  // Nuxt 4 app directory layout
  future: {
    compatibilityVersion: 4,
  },

  // CSS entry point
  css: ['~/assets/css/main.css'],

  // Runtime config — public values are safe to expose to the client.
  // Sensitive values (privateRuntimeConfig) are server-only.
  runtimeConfig: {
    // Server-only (Firebase Admin SDK)
    firebaseAdminProjectId: '',
    firebaseAdminClientEmail: '',
    firebaseAdminPrivateKey: '',

    // Public (Firebase client SDK — these are intentionally public)
    public: {
      firebaseApiKey: '',
      firebaseAuthDomain: '',
      firebaseProjectId: '',
      firebaseStorageBucket: '',
      firebaseMessagingSenderId: '',
      firebaseAppId: '',
    },
  },

  // Google Fonts (Optimized: only load Inter)
  googleFonts: {
    families: {
      Inter: [400, 500, 600, 700],
    },
    download: true,
    useStylesheet: false,
  },

  // TypeScript
  typescript: {
    strict: true,
    typeCheck: false, // Run separately with nuxt typecheck
  },
})
