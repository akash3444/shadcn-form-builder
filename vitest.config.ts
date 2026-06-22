import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    // Unit tests only — the codegen type-check harness (scripts/typecheck-codegen.ts)
    // remains a separate `pnpm typecheck:codegen` run.
    include: ["lib/**/*.test.ts"],
    environment: "node",
  },
})
