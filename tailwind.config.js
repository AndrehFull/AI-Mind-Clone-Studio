/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
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
        // Connectome theme palette (literal so opacity modifiers work).
        c: {
          bg: "#04050a",
          surface: "rgba(16,20,30,0.62)",
          surface2: "rgba(26,32,46,0.7)",
          surface3: "rgba(40,48,66,0.6)",
          line: "rgba(150,180,255,0.12)",
          line2: "rgba(150,180,255,0.26)",
          ink: "#eef2fb",
          ink2: "#9aa6bd",
          ink3: "#5f6a82",
          accent: "#22d3ee",
          accentStrong: "#0aa5c2",
          accentSoft: "rgba(34,211,238,0.14)",
          accentInk: "#03222a",
          good: "#34e0a1",
          hot: "#ff5fa8",
        },
        // Legacy aliases → mapped to the new theme until old screens are rethemed.
        neon: {
          blue: "#22d3ee",
          cyan: "#22d3ee",
          purple: "#ff5fa8",
          pink: "#ff5fa8",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        glass: "0 40px 100px -40px rgba(0,0,0,0.85)",
      },
      keyframes: {
        "accordion-down": { from: { height: 0 }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: 0 } },
        scan: { "0%": { transform: "translateY(-10vh)" }, "100%": { transform: "translateY(110vh)" } },
        flick: { "0%,100%": { opacity: 0.5 }, "50%": { opacity: 0.9 } },
        livedot: {
          "0%": { boxShadow: "0 0 0 0 rgba(52,224,161,0.5)" },
          "70%": { boxShadow: "0 0 0 7px transparent" },
          "100%": { boxShadow: "0 0 0 0 transparent" },
        },
        toastin: {
          from: { opacity: 0, transform: "translate(-50%,16px)" },
          to: { opacity: 1, transform: "translate(-50%,0)" },
        },
        // legacy (kept so old screens still animate during transition)
        "pulse-neon": {
          "0%,100%": { opacity: 1, transform: "scale(1)" },
          "50%": { opacity: 0.7, transform: "scale(1.05)" },
        },
        float: { "0%,100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-10px)" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        scan: "scan 9s linear infinite",
        flick: "flick 2.2s ease-in-out infinite",
        livedot: "livedot 2.2s ease-out infinite",
        toastin: "toastin 0.35s cubic-bezier(0.2,0.7,0.2,1) both",
        "pulse-neon": "pulse-neon 2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
      },
      fontFamily: {
        geist: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        "geist-mono": ["var(--font-geist-mono)", "monospace"],
        // legacy aliases
        orbitron: ["var(--font-geist-sans)", "sans-serif"],
        inter: ["var(--font-geist-sans)", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
