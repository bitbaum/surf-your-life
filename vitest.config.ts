import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/__tests__/**/*.test.ts"],
    globals: false,
    // Pin TZ so DST-aware tests are deterministic regardless of CI host TZ.
    // Europe/Zurich matches the clinic's locale and reproduces the DST
    // transitions our domain helpers must handle.
    env: { TZ: "Europe/Zurich" },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
