import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

// https://vite.dev/config/
export default defineConfig({
  plugins: [TanStackRouterVite({ routeFileIgnorePattern: ".(test|spec)." }), react(), tailwindcss()],
  resolve: {
    // mirror the "paths" in tsconfig.app.json
    alias: [
      {
        find: /^#(api|assets|hooks|mocks|routes|types|ui|utils)\//,
        replacement: fileURLToPath(new URL("./src/$1/", import.meta.url)),
      },
    ],
  },
  server: {
    // proxy requests prefixed '/api' and '/uploads'
    proxy: {
      "/api": "http://localhost:8000",
      "/uploads": "http://localhost:8000",
    },
  },
  build: {
    target: "esnext",
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    globals: true,
  },
});
