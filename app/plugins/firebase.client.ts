/**
 * Firebase Client SDK — Initialization Plugin
 *
 * Runs on the client only (.client.ts suffix).
 * Never initialized server-side (Firebase Admin SDK is used server-side instead).
 *
 * Credentials are read from public runtime config (NUXT_PUBLIC_* env vars).
 * These are intentionally public — they are the Firebase client config, not secrets.
 *
 * Source of truth: .agent/architecture.md § Authentication Architecture
 * Rules: .agent/rules.md § Firebase (Client)
 *
 * Phase 1: Sets up the Firebase app instance and provides it via NuxtApp.
 * Phase 2 will add: getAuth, getFirestore, and composable helpers.
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const firebaseConfig = {
    apiKey: config.public.firebaseApiKey,
    authDomain: config.public.firebaseAuthDomain,
    projectId: config.public.firebaseProjectId,
    storageBucket: config.public.firebaseStorageBucket,
    messagingSenderId: config.public.firebaseMessagingSenderId,
    appId: config.public.firebaseAppId,
  }

  // Prevent duplicate initialization during hot module replacement
  let app: FirebaseApp
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig)
  }
  else {
    app = getApps()[0]!
  }

  // Provide the Firebase app instance to the Nuxt app.
  // Auth and Firestore instances will be added in Phase 2.
  return {
    provide: {
      firebaseApp: app,
      firebaseAuth: getAuth(app),
    },
  }
})
