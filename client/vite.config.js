import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
        "/api/notes": {
          target: "http://localhost:5000",
          changeOrigin: true,
          secure: false
        },
        "/api/auth": {
          target: "http://localhost:5000",
          changeOrigin: true,
          secure: false
        },
        "/api/ai": {
          target: "http://localhost:5000",
          changeOrigin: true,
          secure: false
        },
    },
  },
});
