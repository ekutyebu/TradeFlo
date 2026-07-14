/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base:    '#0D0E12',
          surface: '#13151A',
          card:    '#171920',
          border:  '#1E2028',
          hover:   '#22252F',
        },
        primary: {
          DEFAULT: '#10B981',
          dim:     'rgba(16,185,129,0.15)',
          glow:    'rgba(16,185,129,0.25)',
        },
        red: {
          DEFAULT: '#EF4444',
          dim:     'rgba(239,68,68,0.15)',
        },
        amber: {
          DEFAULT: '#F59E0B',
          dim:     'rgba(245,158,11,0.15)',
        },
        text: {
          primary: '#F9FAFB',
          muted:   '#6B7280',
          subtle:  '#374151',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16,185,129,0.15), transparent)',
        'card-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(16,185,129,0.2)',
        'glow-md': '0 0 20px rgba(16,185,129,0.25), 0 0 60px rgba(16,185,129,0.08)',
        'glow-lg': '0 0 40px rgba(16,185,129,0.3), 0 0 100px rgba(16,185,129,0.1)',
        'card':    '0 1px 0 rgba(255,255,255,0.05), 0 4px 24px rgba(0,0,0,0.4)',
        'panel':   '0 0 0 1px rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.4s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(16,185,129,0.2)' },
          '50%': { boxShadow: '0 0 25px rgba(16,185,129,0.4)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
