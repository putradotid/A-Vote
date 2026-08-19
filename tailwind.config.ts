import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{vue,ts,js}',
    './server/**/*.{ts,js}',
  ],
  theme: {
    extend: {
      colors: {
        // ─── Design System Color Palette (design.md) ────────────────
        primary: {
          DEFAULT: '#2563EB',
          dark: '#1D4ED8',
        },
        background: '#F8FAFC',
        surface: '#FFFFFF',
        text: {
          primary: '#0F172A',
          secondary: '#475569',
          muted: '#64748B',
        },
        border: '#E2E8F0',
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
        info: '#0284C7',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Typography scale (design.md)
        'h1': ['2rem', { fontWeight: '700', lineHeight: '1.2' }],
        'h2': ['1.5rem', { fontWeight: '600', lineHeight: '1.3' }],
        'h3': ['1.25rem', { fontWeight: '600', lineHeight: '1.4' }],
        'body': ['1rem', { fontWeight: '400', lineHeight: '1.6' }],
        'small': ['0.875rem', { fontWeight: '400', lineHeight: '1.5' }],
        'caption': ['0.75rem', { fontWeight: '400', lineHeight: '1.4' }],
      },
      borderRadius: {
        card: '0.75rem',
        button: '0.5rem',
        badge: '9999px',
        input: '0.5rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.10), 0 2px 4px -1px rgb(0 0 0 / 0.06)',
        modal: '0 20px 60px -10px rgb(0 0 0 / 0.25)',
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
    },
  },
  plugins: [],
} satisfies Config
