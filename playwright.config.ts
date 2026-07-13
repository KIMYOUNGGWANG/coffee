import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./test",
  testIgnore: "**/mobile-note-detail.test.ts",
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:3000",
    serviceWorkers: "block",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npx next start --hostname 127.0.0.1 --port 3000",
    port: 3000,
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === "1",
  },
});
