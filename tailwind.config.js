/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5',
          hover: '#4338CA',
          soft: '#EEF2FF',
        },
        accent: {
          DEFAULT: '#7C3AED',
        },
        background: {
          DEFAULT: '#FFFFFF',
          secondary: '#F9FAFB',
        },
        border: '#E5E7EB',
        text: {
          primary: '#111827',
          secondary: '#6B7280',
          muted: '#9CA3AF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'hero': ['48px', { lineHeight: '1.2', fontWeight: '700' }],
        'hero-lg': ['60px', { lineHeight: '1.2', fontWeight: '700' }],
        'section': ['28px', { lineHeight: '1.3', fontWeight: '600' }],
        'section-lg': ['32px', { lineHeight: '1.3', fontWeight: '600' }],
        'subheading': ['20px', { lineHeight: '1.4', fontWeight: '500' }],
        'subheading-lg': ['22px', { lineHeight: '1.4', fontWeight: '500' }],
      },
      spacing: {
        '4': '4px',
        '8': '8px',
        '12': '12px',
        '14': '14px',
        '16': '16px',
        '20': '20px',
        '24': '24px',
        '32': '32px',
        '48': '48px',
        '64': '64px',
      },
      borderRadius: {
        'button': '12px',
        'input': '10px',
        'card': '16px',
      },
      boxShadow: {
        'card': '0 10px 25px rgba(0,0,0,0.06)',
      },
      transitionDuration: {
        'DEFAULT': '200ms',
      },
      transitionTimingFunction: {
        'DEFAULT': 'ease',
      },
    },
  },
  plugins: [],
};
