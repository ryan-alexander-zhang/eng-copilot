import nextEnv from "@next/env";
import { defineConfig } from "@playwright/test";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const hasAppEnv =
  Boolean(process.env.DATABASE_URL) &&
  Boolean(process.env.NEXTAUTH_SECRET);

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:3000",
  },
  webServer: hasAppEnv
    ? {
        command: "npm run dev -- --hostname 127.0.0.1 --port 3000",
        url: "http://127.0.0.1:3000",
        reuseExistingServer: false,
        env: {
          ...process.env,
          NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "http://127.0.0.1:3000",
          GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "playwright-google-client-id",
          GOOGLE_CLIENT_SECRET:
            process.env.GOOGLE_CLIENT_SECRET ?? "playwright-google-client-secret",
        },
      }
    : undefined,
});
