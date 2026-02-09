import { defineConfig } from "vite";

export default defineConfig({
  base: "/spiral-path/",
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          p5: ["p5", "p5.js-svg"],
        },
      },
    },
  },
});
