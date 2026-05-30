import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react") || id.includes("react-dom") || id.includes("react-router-dom")) {
            return "react-core";
          }
          if (id.includes("firebase")) return "firebase";
          if (id.includes("lucide-react") || id.includes("react-icons")) return "icons";
          return "vendor";
        },
      },
    },
  },
})
