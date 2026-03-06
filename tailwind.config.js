/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#0C0D0F',
          secondary: '#111316',
          elevated: '#16191E',
          overlay: '#1C2028',
        },
        line: {
          subtle: '#1E2129',
          DEFAULT: '#272C35',
          strong: '#353B47',
        },
        ink: {
          primary: '#F0F2F5',
          secondary: '#8B939F',
          tertiary: '#5A6272',
          muted: '#3D4351',
        },
        accent: {
          DEFAULT: '#F59E0B',
          hover: '#FBBF24',
          muted: '#1E1A0E',
          border: '#3D3010',
        },
        success: {
          DEFAULT: '#10B981',
          muted: '#0D1C16',
          border: '#0A3322',
        },
        danger: {
          DEFAULT: '#EF4444',
          muted: '#200D0D',
          border: '#3D1010',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
