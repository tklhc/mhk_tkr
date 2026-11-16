import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// Çıktı tek bir dist/index.html: görseller ve kod içine gömülür,
// dosya çift tıklanarak (file://) da açılır.
export default defineConfig({
  base: "./",
  plugins: [react(), viteSingleFile()],
  build: { target: "es2020", assetsInlineLimit: 100_000_000 },
  test: { environment: "node", include: ["tests/**/*.test.js"] },
});
