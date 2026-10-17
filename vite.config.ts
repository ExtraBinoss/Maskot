import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vite";
import { seo } from "./scripts/seo.ts";

export default defineConfig({
  server: { port: 8400, strictPort: true },
  preview: { port: 8400, strictPort: true },
  plugins: [
    seo(),
    tailwindcss(),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
