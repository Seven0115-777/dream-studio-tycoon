import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/dream-studio-tycoon/",
  plugins: [react()],
  root: "static-site",
  publicDir: "../public",
  build: {
    emptyOutDir: true,
    outDir: "../docs",
  },
});
