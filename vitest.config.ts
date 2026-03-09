import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // API/security tests are server-side; node environment is more stable and faster.
    environment: "node",
    globals: true,
    setupFiles: ["./src/tests/setup.ts"],
    // Windows fork pool can hang with larger route imports in this repo.
    pool: "threads",
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
