import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-sandbox/**", // the sandbox UI's build folder (pnpm dev:sandbox)
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Scratch space for throwaway scripts (gitignored).
    ".sandbox/**",
  ]),
]);

export default eslintConfig;
