/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#fbfaff',
        card: '#ffffff',
        fg: '#0b1020',
        muted: '#5c687d',
        accent: {
          DEFAULT: '#5b21b6',
          hover: '#4c1d95',
          secondary: '#7c3aed',
          light: '#f5f3ff',
        },
        border: '#e4e0ee',
        subtle: '#f7f5fc',
      },
      maxWidth: {
        page: '1200px',
        reading: '720px',
      },
      borderRadius: {
        control: '10px',
        panel: '14px',
        card: '20px',
        hero: '28px',
      },
      boxShadow: {
        e1: '0 1px 2px rgba(15, 16, 32, 0.05)',
        e2: '0 1px 2px rgba(15, 16, 32, 0.05), 0 8px 20px -10px rgba(91, 33, 182, 0.16)',
        e3: '0 2px 4px rgba(15, 16, 32, 0.04), 0 24px 56px -20px rgba(91, 33, 182, 0.22)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
