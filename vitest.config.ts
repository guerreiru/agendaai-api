import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.{service,routes}.test.ts"],
    exclude: ["node_modules", "dist", "**/node_modules/**"],
    globals: true,
  },
});
