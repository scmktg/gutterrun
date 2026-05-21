/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    // Lock the palette: only brand tokens are exposed.
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      green: {
        matte: '#2F4A3A',
        deep: '#1E3127',
        tint: '#E8EFE9',
      },
      white: '#FFFFFF',
      ink: '#0F0F0F',
      hairline: '#D9DDD7',
    },
    fontFamily: {
      display: ['Fraunces', 'serif'],
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
    },
    extend: {
      fontWeight: {
        // Inter is restricted to 400 and 500 only.
        normal: '400',
        medium: '500',
      },
      letterSpacing: {
        eyebrow: '0.18em',
      },
      fontSize: {
        hero: ['clamp(2.75rem, 8vw, 6.25rem)', { lineHeight: '0.98', letterSpacing: '-0.02em' }],
        headline: ['clamp(2rem, 5vw, 3.75rem)', { lineHeight: '1.02', letterSpacing: '-0.015em' }],
        eyebrow: ['0.75rem', { lineHeight: '1', letterSpacing: '0.18em' }],
      },
    },
  },
  plugins: [],
};
