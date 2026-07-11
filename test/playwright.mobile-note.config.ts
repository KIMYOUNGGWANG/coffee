import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "mobile-note-detail.test.ts",
  workers: 1,
  timeout: 90_000,
  outputDir: "/tmp/coffeedex-mobile-note-test-results",
  use: {
    baseURL: "http://127.0.0.1:8081",
    serviceWorkers: "block",
    trace: "on-first-retry",
  },
  webServer: {
    command: "CI=1 npm run web -- --port 8081",
    cwd: "../mobile",
    port: 8081,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
