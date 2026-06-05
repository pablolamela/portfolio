// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import { fileURLToPath } from "node:url";

// https://astro.build/config
export default defineConfig({
  site: "https://pablolamela.com/",
  integrations: [react()],
  vite: {
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        "~": fileURLToPath(new URL("./", import.meta.url)),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          // Auto-inject the Sass builders into every .scss/.module.scss
          // (mirrors the scaffold's vite additionalData). loadPaths lets
          // `@import "builders"` resolve to src/styles/_builders.scss.
          loadPaths: [fileURLToPath(new URL("./src/styles", import.meta.url))],
          additionalData: `@import "builders";`,
        },
      },
    },
  },
});
