/** @type {import('tailwindcss').Config} */
// Spyda's design system, re-tinted for Revival One: the flame pink takes the
// place of Spyda's mint, ember amber takes the place of its sky blue.
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        short: { raw: '(min-width: 1024px) and (max-height: 820px)' },
      },
      fontFamily: {
        sans: ["Montserrat", "system-ui", "sans-serif"],
        heading: ["Space Grotesk", "Montserrat", "sans-serif"],
        scripture: ["Literata", "Georgia", "serif"],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #ff5c8a 0%, #e11d5c 100%)',
        'brand-gradient-text': 'linear-gradient(135deg, #ffd1dd 0%, #ff5c8a 100%)',
      },
      colors: {
        // Theme tokens (see the :root, .dark and .light blocks in index.css).
        // "white" is the ink colour: white on the dark theme, deep plum on the light one,
        // so every white/[0.07] border and wash flips with the theme.
        white: 'rgb(var(--ink) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          raised: 'rgb(var(--surface-raised) / <alpha-value>)',
        },
        shell: 'rgb(var(--shell) / <alpha-value>)',
        plum: 'rgb(var(--plum) / <alpha-value>)',
        'primary-soft': 'rgb(var(--primary-soft) / <alpha-value>)',
        ember: '#ffb36b',
        lilac: '#d7b8ff',
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out forwards",
      },
    },
  },
  plugins: [],
}
