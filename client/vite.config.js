import { defineConfig, loadEnv  } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from '@tailwindcss/vite'
import path from "path"


export default defineConfig(({ mode }) => {
  // Load env variables based on current mode (development / production)
  const env = loadEnv(mode, process.cwd(), "");
  console.log(env)
  const API_BASE = env.VITE_API_URL;
  console.log(API_BASE)

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api/notes": {
          target: API_BASE,
          changeOrigin: true,
          secure: false,
        },
        "/api/auth": {
          target: API_BASE,
          changeOrigin: true,
          secure: false,
        },
        "/api/ai": {
          target: API_BASE,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
