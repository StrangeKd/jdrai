import path from "node:path";

import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tanstackRouter({ target: "react", autoCodeSplitting: true }), tailwindcss(), react()],
  envDir: path.resolve(__dirname, "../../"), // load root .env (VITE_API_URL, etc.)
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy all /api requests to the backend — same-origin cookies + no CORS
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
