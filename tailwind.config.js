/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist Variable', 'sans-serif'],
        mono: ['Geist Mono Variable', 'monospace'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [
    function ({ matchUtilities, addUtilities }) {
      addUtilities({
        '.mask-alpha': { 'mask-mode': 'alpha', '-webkit-mask-mode': 'alpha' },
        '.mask-intersect': { 'mask-composite': 'intersect', '-webkit-mask-composite': 'source-in' },
        '.mask-no-clip': { 'mask-clip': 'no-clip', '-webkit-mask-clip': 'no-clip' },
        '.mask-no-repeat': { 'mask-repeat': 'no-repeat', '-webkit-mask-repeat': 'no-repeat' },
      })
      matchUtilities({
        'mask-position': (value) => ({
          'mask-position': value.replace(/_/g, ' '),
          '-webkit-mask-position': value.replace(/_/g, ' '),
        }),
        'mask-size': (value) => ({
          'mask-size': value.replace(/_/g, ' '),
          '-webkit-mask-size': value.replace(/_/g, ' '),
        }),
      })
    },
  ],
}
