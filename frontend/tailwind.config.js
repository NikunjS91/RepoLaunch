/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        terminal: '#0d1117',
        accent: { DEFAULT: '#34d399', dim: '#059669' },
        surface: {
          DEFAULT: '#18181b',
          elevated: '#27272a',
          border: '#3f3f46',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Menlo', 'monospace'],
      },
      animation: {
        'pulse-dot': 'pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in-up': 'fadeInUp 0.15s ease-out',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  safelist: [
    'text-emerald-400', 'text-yellow-400', 'text-red-400',
    'text-blue-400', 'text-zinc-400', 'bg-emerald-400/10',
    'bg-yellow-400/10', 'bg-red-400/10', 'bg-blue-400/10', 'bg-zinc-400/10',
    'border-emerald-400/30', 'border-yellow-400/30', 'border-red-400/30',
    'border-blue-400/30', 'border-zinc-400/30',
  ],
  plugins: [],
}
