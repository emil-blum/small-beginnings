import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    VitePWA({
      // New releases install in the background and take over on the next open.
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["icons/favicon-64.png", "icons/apple-touch-icon.png"],
      manifest: {
        name: "Small Beginnings",
        short_name: "Beginnings",
        description: "Meet tasks while they are small. Tend practices a little at a time.",
        lang: "en-GB",
        start_url: "/#today",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#E6ECE5",
        theme_color: "#E6ECE5",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Cache the whole app shell so it opens with no connection.
        globPatterns: ["**/*.{js,css,html,woff2,png,svg,webmanifest}"],
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
