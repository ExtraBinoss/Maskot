import { defineConfig } from "@playwright/test";

// The application keeps strict port 8400. Browser checks use an isolated preview.
const port = Number(
  process.env.MASKOT_TEST_PORT ?? process.env.MASCOTLAB_TEST_PORT ?? 8002,
);
export default defineConfig({
  testDir: "tests",
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
    locale: "fr-FR",
    trace: "retain-on-failure",
  },
  webServer: {
    command: `bun run preview --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 30000,
  },
});
