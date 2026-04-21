import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  outDir: "dist",
  splitting: false,
  // Bundle @jdrai/shared inline — avoids runtime ESM extension issues
  // from the shared package's tsc-compiled dist
  noExternal: ["@jdrai/shared"],
});
