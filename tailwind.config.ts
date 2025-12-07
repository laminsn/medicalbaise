import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      /* === TYPOGRAPHY SCALE === */
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],      /* 12px */
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],  /* 14px */
        'base': ['1rem', { lineHeight: '1.5rem' }],     /* 16px */
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],  /* 18px */
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],   /* 20px */
        '2xl': ['1.5rem', { lineHeight: '2rem' }],      /* 24px */
        '3xl': ['1.75rem', { lineHeight: '2.25rem' }],  /* 28px */
        '4xl': ['2rem', { lineHeight: '2.5rem' }],      /* 32px */
      },
      colors: {
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
        /* === STATUS COLORS === */
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        error: {
          DEFAULT: "hsl(var(--error))",
          foreground: "hsl(var(--error-foreground))",
        },
        /* === EMERALD PALETTE === */
        emerald: {
          50: "hsl(var(--emerald-50))",
          100: "hsl(var(--emerald-100))",
          200: "hsl(var(--emerald-200))",
          300: "hsl(var(--emerald-300))",
          400: "hsl(var(--emerald-400))",
          500: "hsl(var(--emerald-500))",
          600: "hsl(var(--emerald-600))",
          700: "hsl(var(--emerald-700))",
          800: "hsl(var(--emerald-800))",
          900: "hsl(var(--emerald-900))",
          950: "hsl(var(--emerald-950))",
        },
        /* === SLATE PALETTE === */
        slate: {
          50: "hsl(var(--slate-50))",
          100: "hsl(var(--slate-100))",
          200: "hsl(var(--slate-200))",
          300: "hsl(var(--slate-300))",
          400: "hsl(var(--slate-400))",
          500: "hsl(var(--slate-500))",
          600: "hsl(var(--slate-600))",
          700: "hsl(var(--slate-700))",
          800: "hsl(var(--slate-800))",
          900: "hsl(var(--slate-900))",
          950: "hsl(var(--slate-950))",
        },
      },
      /* === BORDER RADIUS (6px to pill) === */
      borderRadius: {
        'none': '0',
        'sm': '0.375rem',      /* 6px */
        DEFAULT: '0.5rem',     /* 8px */
        'md': '0.625rem',      /* 10px */
        'lg': '0.75rem',       /* 12px */
        'xl': '1rem',          /* 16px */
        '2xl': '1.5rem',       /* 24px */
        'full': '9999px',      /* pill */
      },
      /* === SPACING (8-point grid) === */
      spacing: {
        '0.5': '0.125rem',   /* 2px */
        '1': '0.25rem',      /* 4px */
        '2': '0.5rem',       /* 8px */
        '3': '0.75rem',      /* 12px */
        '4': '1rem',         /* 16px */
        '5': '1.25rem',      /* 20px */
        '6': '1.5rem',       /* 24px */
        '7': '1.75rem',      /* 28px */
        '8': '2rem',         /* 32px */
        '10': '2.5rem',      /* 40px */
        '12': '3rem',        /* 48px */
        '16': '4rem',        /* 64px */
        '20': '5rem',        /* 80px */
        'safe-top': 'var(--safe-area-inset-top)',
        'safe-bottom': 'var(--safe-area-inset-bottom)',
      },
      /* === BOX SHADOWS === */
      boxShadow: {
        'xs': 'var(--shadow-xs)',
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        'card': 'var(--shadow-md)',
        'card-hover': 'var(--shadow-lg)',
        'emerald': 'var(--shadow-emerald)',
        'red': 'var(--shadow-red)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "marquee": {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "marquee": "marquee 20s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
