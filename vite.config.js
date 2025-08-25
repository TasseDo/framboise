import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
    server: {
    open: '/framboise.html', 
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        framboise: resolve(__dirname, "framboise.html"), // tell Vite to treat index.html as "framboise"
      },
      output: {
        entryFileNames: "framboise.js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith(".css")) {
            return "framboise.css";
          }
          return "assets/[name][extname]";
        },
      },
    },
  },
});
