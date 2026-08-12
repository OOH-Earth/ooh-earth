/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius))',
        sm: 'calc(var(--radius))',
        none: '0px',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        void: 'rgb(var(--c-void) / <alpha-value>)',
        silver: 'rgb(var(--c-silver) / <alpha-value>)',
        ozone: 'rgb(var(--c-ozone) / <alpha-value>)',
        flare: 'rgb(var(--c-flare) / <alpha-value>)',
        brand: {
          yellow: '#EDFF00',
          pink: '#FF5470',
          blue: '#1F51FF',
          green: '#39FF14',
          orange: '#FFA500',
          neon: '#FF5C00',
          deeppink: '#FF007F',
          gray: '#B2B2B2',
          smoke: '#F1F1F1',
        },
        slate2: 'rgb(var(--c-slate2) / <alpha-value>)',
        dim: 'rgb(var(--c-dim) / <alpha-value>)',
        darkgray: 'rgb(var(--c-darkgray) / <alpha-value>)',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        flareToken: 'hsl(var(--flare))',
      },
      fontFamily: {
        heading: ['var(--font-heading)'],
        body: ['var(--font-body)'],
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
        brand: ['var(--font-brand)'],
      },
      letterSpacing: {
        label: '0.3em',
        tight2: '-0.02em',
      },
      boxShadow: {
        'ozone-glow': '0 0 24px rgba(237, 255, 0, 0.22)',
        'flare-glow': '0 0 24px rgba(255, 92, 0, 0.28)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        blink: {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
        'scan-sweep': {
          from: { transform: 'translateY(0)' },
          to: { transform: 'translateY(100vh)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        blink: 'blink 1.1s steps(1) infinite',
        scan: 'scan-sweep 7s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
