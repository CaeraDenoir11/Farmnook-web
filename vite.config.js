// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite"; // Or your specific Tailwind plugin

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(), // Make sure this plugin is correctly configured
    react()
  ],
  server: {
    port: 5173, // Your Vite frontend dev server port
    proxy: {
      '/api': {
        target: 'http://localhost:4242', // <--- Points to your Express server (server.js)
        changeOrigin: true, // Important for proper proxying
        // secure: false, // Usually not needed for localhost http to http
        // rewrite: (path) => path.replace(/^\/api/, '') // DO NOT use rewrite if your Express routes start with /api
      },
    },
  },
});