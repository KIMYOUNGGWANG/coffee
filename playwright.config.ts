import { defineConfig } from "@playwright/test";

const bundledNodePath =
  "/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node";

export default defineConfig({
  testDir: "./test",
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: `${bundledNodePath} node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3000`,
    port: 3000,
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === "1",
  },
});
