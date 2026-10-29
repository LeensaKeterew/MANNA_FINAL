import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The frontend talks to the Express backend through relative /api routes.
// In dev, Vite proxies /api and /uploads to the backend. In Docker, nginx does.
const backend = process.env.VITE_BACKEND_URL || "http://localhost:3000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: backend, changeOrigin: true },
      "/uploads": { target: backend, changeOrigin: true },
    },
  },
});
