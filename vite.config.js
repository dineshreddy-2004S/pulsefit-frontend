import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#0B0F17",
        glassBg: "rgba(255, 255, 255, 0.03)",
        glassBorder: "rgba(255, 255, 255, 0.08)",
        neonCyan: "#00f2fe",
        neonPurple: "#4facfe",
        electricViolet: "#7928CA",
        accentPink: "#FF0080",
      },
      backgroundImage: {
        'cyber-gradient': 'radial-gradient(ellipse at top, #1a103c 0%, #0b0f17 70%)',
        'card-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
        'btn-gradient': 'linear-gradient(90deg, #7928CA 0%, #FF0080 100%)',
        'cyan-gradient': 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)',
      }
    },
  },
  plugins: [react(), tailwindcss()],
})
