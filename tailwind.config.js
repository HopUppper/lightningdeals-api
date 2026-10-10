/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#fbf9f5', // Warm Ivory / Soft Cream
          subtle: '#f5f2eb',   // Pale Sand / Warm tint
          card: '#ffffff',     // Elevated White
          lavender: '#f6f2fd', // Pale Lavender tint
          terracotta: '#fef5ee',// Warm Coral tint
          sage: '#f0fdf4',     // Pale Sage tint
          amber: '#fefce8',    // Warm Amber tint
          dark: '#1c1917',     // Deep Espresso Ink
        },
        ink: {
          DEFAULT: '#1c1917',  // Deep Espresso Primary
          soft: '#44403c',     // Warm Charcoal Body
          muted: '#78716c',    // Warm Stone Muted
          subtle: '#a8a29e',   // Light Stone
        },
        plum: {
          DEFAULT: '#6d28d9',  // Signature Royal Plum / Violet
          hover: '#581c87',    // Deep Mulberry
          deep: '#4c1d95',
          light: '#f5f3ff',
          border: '#ddd6fe',
        },
        terracotta: {
          DEFAULT: '#ea580c',  // Muted Coral / Terracotta
          hover: '#c2410c',
          light: '#fff7ed',
          border: '#fed7aa',
        },
        sage: {
          DEFAULT: '#059669',  // Calm Sage
          hover: '#047857',
          light: '#ecfdf5',
          border: '#a7f3d0',
        },
        amber: {
          DEFAULT: '#d97706',  // Warm Sand / Amber
          hover: '#b45309',
          light: '#fef3c7',
          border: '#fde68a',
        },
        warmBorder: {
          DEFAULT: '#e7e5e4',  // Warm Stone 200 Hairline
          subtle: '#f5f5f4',   // Stone 100
          strong: '#d6d3d1',   // Stone 300
        },
        // Backwards compatibility mappings for existing utility classes
        bg: '#fbf9f5',
        card: '#ffffff',
        fg: '#1c1917',
        muted: '#57534e',
        subtleText: '#78716c',
        subtle: '#f5f2eb',
        border: '#e7e5e4',
        borderStrong: '#d6d3d1',
      },
      maxWidth: {
        page: '1240px',
        reading: '720px',
      },
      borderRadius: {
        control: '8px',
        panel: '12px',
        card: '16px',
        hero: '20px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(28, 25, 23, 0.04)',
        sm: '0 2px 4px rgba(28, 25, 23, 0.05), 0 1px 2px rgba(28, 25, 23, 0.03)',
        md: '0 4px 8px -1px rgba(28, 25, 23, 0.06), 0 2px 4px -1px rgba(28, 25, 23, 0.04)',
        warm: '0 10px 25px -5px rgba(28, 25, 23, 0.06), 0 8px 10px -6px rgba(28, 25, 23, 0.04)',
        plum: '0 4px 14px 0 rgba(109, 40, 217, 0.25)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Charter', 'Georgia', 'Cambria', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'],
      },
    },
  },
  plugins: [],
}
