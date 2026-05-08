import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
      },
      manifest: {
        name: "LUMIÈRE KDS",
        short_name: "KDS",
        description: "Kitchen Display System for LUMIÈRE",
        theme_color: "#18181b",
        background_color: "#18181b",
        display: "fullscreen",
        orientation: "landscape",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/icon.svg",
            sizes: "192x192 512x512",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5174,
    strictPort: false,
  },
  // sockjs-client references Node.js `global` which doesn't exist in browser ESM.
  // Map it to the browser-standard `globalThis` so the import doesn't throw.
  define: {
    global: 'globalThis',
  },
});
