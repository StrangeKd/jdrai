// @ts-check
import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tseslint from "typescript-eslint";

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      // No any — use unknown
      "@typescript-eslint/no-explicit-any": "error",
      // Allow intentionally unused vars/args prefixed with _
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // No unsafe type assertions (allow `as const` via assertionStyle: "as" + objectLiteralTypeAssertions)
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        { assertionStyle: "as", objectLiteralTypeAssertions: "never" },
      ],
      // Import ordering: node → external → monorepo → local → relative
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            ["^node:"], // Node built-ins
            ["^(?!@jdrai|@/)"], // External packages
            ["^@jdrai"], // Monorepo packages
            ["^@/"], // Local aliases
            ["^\\."], // Relative imports
          ],
        },
      ],
      "simple-import-sort/exports": "error",
    },
  },
  {
    ignores: [
      "**/dist/**",
      "**/.turbo/**",
      "**/node_modules/**",
      // shadcn/ui — vendor code, not linted
      "**/components/ui/**",
    ],
  },
);
