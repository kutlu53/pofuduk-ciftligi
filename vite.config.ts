import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png"],
      manifest: {
        name: "Pofuduk Çiftliği",
        short_name: "Pofuduk",
        description: "İlkokul İngilizce pekiştirme oyunu",
        lang: "tr",
        start_url: "./",
        display: "standalone",
        orientation: "portrait",
        background_color: "#fff7e6",
        theme_color: "#ff9f43",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
          { src: "icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,json,webp,mp3,woff2}"],
        navigateFallback: "index.html"
      }
    })
  ]
});
