import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const INPUT = process.env.INPUT ?? "index.html";
const isDev = process.env.NODE_ENV === "development";

// 横断 import（@/shared, @/app, @/features ...）を src ルート基準で解決する。
// tsconfig.json の paths と vitest.config.ts のエイリアスを同じ定義で揃えること。
const srcRoot = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  resolve: {
    alias: { "@": srcRoot },
  },
  build: {
    sourcemap: isDev ? "inline" : undefined,
    cssMinify: !isDev,
    minify: !isDev,
    rollupOptions: { input: INPUT },
    outDir: "dist",
    emptyOutDir: false,
  },
});
