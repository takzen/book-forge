import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    // Point the data layer at a throwaway location. Without this the suite ran
    // against the real library, creating and deleting actual books — and
    // leaving orphans behind whenever a test failed part-way through.
    env: {
      BOOK_FORGE_DB: resolve(__dirname, "./.vitest/book-forge.test.db"),
      BOOK_FORGE_UPLOADS: resolve(__dirname, "./.vitest/uploads"),
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
