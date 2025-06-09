/*
<ai_context>
Configures Tailwind CSS for the app.
</ai_context>
*/

import type { Config } from "tailwindcss"
import { fontFamily } from "tailwindcss/defaultTheme"
import tailwindcssAnimate from "tailwindcss-animate"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}"
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px"
      }
    },
    extend: {
      // AI Summer Camp color palette
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // Primary (Blue)
        primary: {
          DEFAULT: "hsl(217, 91%, 60%)", // Blue
          foreground: "hsl(0, 0%, 100%)",
          50: "hsl(214, 100%, 97%)",
          100: "hsl(214, 95%, 93%)",
          200: "hsl(213, 97%, 87%)",
          300: "hsl(212, 96%, 78%)",
          400: "hsl(213, 94%, 68%)",
          500: "hsl(217, 91%, 60%)",
          600: "hsl(221, 83%, 53%)",
          700: "hsl(224, 76%, 48%)",
          800: "hsl(226, 71%, 40%)",
          900: "hsl(224, 64%, 33%)"
        },
        // Secondary (Gray)
        secondary: {
          DEFAULT: "hsl(210, 40%, 96.1%)",
          foreground: "hsl(222.2, 47.4%, 11.2%)",
          50: "hsl(210, 40%, 98%)",
          100: "hsl(210, 40%, 96.1%)",
          200: "hsl(214, 32%, 91%)",
          300: "hsl(213, 27%, 84%)",
          400: "hsl(215, 20%, 65%)",
          500: "hsl(215, 16%, 47%)",
          600: "hsl(215, 19%, 35%)",
          700: "hsl(215, 25%, 27%)",
          800: "hsl(217, 33%, 17%)",
          900: "hsl(222, 47%, 11%)"
        },
        // Accent (Green for success)
        accent: {
          DEFAULT: "hsl(142, 76%, 36%)", // Green
          foreground: "hsl(0, 0%, 100%)",
          50: "hsl(138, 76%, 97%)",
          100: "hsl(141, 84%, 93%)",
          200: "hsl(141, 79%, 85%)",
          300: "hsl(142, 77%, 73%)",
          400: "hsl(142, 69%, 58%)",
          500: "hsl(142, 71%, 45%)",
          600: "hsl(142, 76%, 36%)",
          700: "hsl(142, 72%, 29%)",
          800: "hsl(143, 64%, 24%)",
          900: "hsl(144, 61%, 20%)"
        },
        // Destructive (Red for errors)
        destructive: {
          DEFAULT: "hsl(0, 84%, 60%)",
          foreground: "hsl(0, 0%, 100%)",
          50: "hsl(0, 86%, 97%)",
          100: "hsl(0, 93%, 94%)",
          200: "hsl(0, 96%, 89%)",
          300: "hsl(0, 94%, 82%)",
          400: "hsl(0, 91%, 71%)",
          500: "hsl(0, 84%, 60%)",
          600: "hsl(0, 72%, 51%)",
          700: "hsl(0, 74%, 42%)",
          800: "hsl(0, 70%, 35%)",
          900: "hsl(0, 63%, 31%)"
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        }
      },
      // Typography system
      fontSize: {
        // Body text
        'body': '16px',
        // Headings
        'h1': '48px',
        'h2': '36px',
        'h3': '24px',
        'h4': '20px',
        'h5': '18px',
        'h6': '16px'
      },
      // Spacing system with 4px base unit
      spacing: {
        '0': '0px',
        '1': '4px',   // space-1
        '2': '8px',   // space-2
        '3': '12px',  // space-3
        '4': '16px',  // space-4
        '5': '20px',  // space-5
        '6': '24px',  // space-6
        '7': '28px',  // space-7
        '8': '32px',  // space-8
        '9': '36px',  // space-9
        '10': '40px', // space-10
        '11': '44px', // space-11
        '12': '48px', // space-12
        '14': '56px', // space-14
        '16': '64px', // space-16
        '20': '80px', // space-20
        '24': '96px', // space-24
        '28': '112px', // space-28
        '32': '128px', // space-32
        '36': '144px', // space-36
        '40': '160px', // space-40
        '44': '176px', // space-44
        '48': '192px', // space-48
        '52': '208px', // space-52
        '56': '224px', // space-56
        '60': '240px', // space-60
        '64': '256px', // space-64
        '72': '288px', // space-72
        '80': '320px', // space-80
        '96': '384px', // space-96
      },
      // Responsive breakpoints
      screens: {
        'mobile': '640px',   // sm
        'tablet': '768px',   // md
        'desktop': '1024px', // lg
        'wide': '1280px',    // xl
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"]
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" }
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" }
        },
        gradient: {
          to: {
            backgroundPosition: "var(--bg-size) 0"
          }
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(calc(-100% - var(--gap)))" }
        },
        "marquee-vertical": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(calc(-100% - var(--gap)))" }
        },
        "draw-underline": {
          to: {
            strokeDashoffset: "0"
          }
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        gradient: "gradient 8s linear infinite",
        marquee: "marquee var(--duration) linear infinite",
        "marquee-vertical": "marquee-vertical var(--duration) linear infinite",
        "draw-underline": "draw-underline 0.5s ease-out forwards",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))"
      },
      boxShadow: {
        "purple-sm": "0 2px 10px rgba(147, 51, 234, 0.1)",
        "purple-md": "0 10px 40px rgba(147, 51, 234, 0.3)",
        "purple-lg": "0 15px 50px rgba(147, 51, 234, 0.4)",
        "purple-xl": "0 20px 60px rgba(147, 51, 234, 0.5)"
      }
    }
  },
  plugins: [tailwindcssAnimate]
} satisfies Config

export default config
