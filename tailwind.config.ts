import type { Config } from 'tailwindcss'

export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          0: '#1e1f22',
          1: '#26272b',
          2: '#2b2d31',
          3: '#313338',
          border: '#3a3c41'
        },
        accent: {
          DEFAULT: '#4f8cff',
          hover: '#6c9fff',
          muted: '#2a3a5c'
        },
        rarity: {
          common: '#9aa0a6',
          uncommon: '#3fb950',
          rare: '#4f8cff',
          epic: '#b366ff',
          legendary: '#ffab40'
        }
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace']
      }
    }
  },
  plugins: []
} satisfies Config
