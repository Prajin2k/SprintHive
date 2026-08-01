/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Sprint Hive Brand Palette ──────────────────────────
        brand: {
          50:  '#eef0ff',
          100: '#dde1ff',
          200: '#bbc3ff',
          300: '#99a4ff',
          400: '#7786ff',
          500: '#5B5FFF',   // primary indigo
          600: '#4144cc',
          700: '#2f3199',
          800: '#1e2066',
          900: '#0d0f33',
          950: '#06071a',
        },
        // ── Secondary violet ──────────────────────────────────
        secondary: {
          400: '#a78bfa',
          500: '#7C3AED',
          600: '#6d28d9',
        },
        // ── Accent cyan ───────────────────────────────────────
        accent: {
          400: '#67e8f9',
          500: '#22D3EE',
          600: '#0891b2',
        },
        // ── Dark surfaces ─────────────────────────────────────
        surface: {
          900: '#0F172A',   // background
          800: '#1E293B',   // surface
          700: '#1F2937',   // card
          600: '#334155',   // border
          500: '#475569',
          400: '#64748b',
          300: '#94A3B8',
        },
        // ── Semantic ──────────────────────────────────────────
        success:  '#22C55E',
        warning:  '#F59E0B',
        danger:   '#EF4444',
        info:     '#3b82f6',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xl:  '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        glow:     '0 0 24px rgba(91,95,255,0.35)',
        'glow-sm': '0 0 12px rgba(91,95,255,0.2)',
        'glow-cyan': '0 0 20px rgba(34,211,238,0.25)',
        card:     '0 4px 24px rgba(0,0,0,0.45)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.55)',
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow':  'spin 2s linear infinite',
        'float':      'float 3s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(91,95,255,0.2)' },
          '50%':      { boxShadow: '0 0 28px rgba(91,95,255,0.5)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mesh-dark': `
          radial-gradient(at 20% 30%, hsla(238, 100%, 65%, 0.1) 0px, transparent 55%),
          radial-gradient(at 80% 70%, hsla(260, 70%, 55%, 0.08) 0px, transparent 55%),
          radial-gradient(at 50% 50%, hsla(186, 80%, 55%, 0.04) 0px, transparent 60%)
        `,
        'brand-gradient': 'linear-gradient(135deg, #5B5FFF 0%, #7C3AED 100%)',
        'brand-gradient-hover': 'linear-gradient(135deg, #4144cc 0%, #6d28d9 100%)',
      },
    },
  },
  plugins: [],
};
