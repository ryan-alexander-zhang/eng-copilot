import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

const authFile = fileURLToPath(new URL("./auth.ts", import.meta.url));
const srcDir = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "jsdom",
    exclude: [...configDefaults.exclude, "tests/e2e/**"],
  },
  resolve: {
    alias: [
      {
        find: "@/auth",
        replacement: authFile,
      },
      {
        find: "@",
        replacement: srcDir,
      },
    ],
  },
});
