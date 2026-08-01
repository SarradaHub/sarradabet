import { defineConfig, devices } from "@playwright/test";
import { defineBddConfig, cucumberReporter } from "playwright-bdd";

const repoRoot = "..";
const skipManagedServers = process.env.E2E_SKIP_WEBSERVER === "true";

const testDir = defineBddConfig({
  features: "features/**/*.feature",
  steps: ["fixtures/fixtures.ts", "steps/**/*.ts", "hooks/**/*.ts"],
});

const chromeUse = {
  ...devices["Desktop Chrome"],
  launchOptions: {
    args: [
      "--disable-http-cache",
      "--disable-features=BackForwardCache",
    ],
  },
};

export default defineConfig({
  testDir,
  globalSetup: "./global-setup.ts",
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ["html", { open: "never" }],
    cucumberReporter("html", { outputFile: "cucumber-report/report.html" }),
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3002",
    ignoreHTTPSErrors: true,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "on-first-retry",
  },
  projects: process.env.CI
    ? [{ name: "chromium", use: chromeUse }]
    : [
        { name: "chromium", use: chromeUse },
        { name: "firefox", use: { ...devices["Desktop Firefox"] } },
        { name: "webkit", use: { ...devices["Desktop Safari"] } },
      ],
  webServer: skipManagedServers
    ? undefined
    : [
        {
          command: "npm run -w apps/api dev",
          url: "http://localhost:8000/health",
          cwd: repoRoot,
          reuseExistingServer: true,
          timeout: 120_000,
          env: {
            MERCADOPAGO_MOCK_PIX: "true",
            JWT_SECRET: "e2e-test-secret",
            DATABASE_URL:
              "postgresql://appuser:sarradabet1234@localhost:5433/sarradabet",
            DIRECT_URL:
              "postgresql://appuser:sarradabet1234@localhost:5433/sarradabet",
            REDIS_URL: "redis://localhost:6379",
            CORS_ORIGINS: "http://localhost:3002",
          },
        },
        {
          command: "npm run -w apps/web dev",
          url: "http://localhost:3002",
          cwd: repoRoot,
          reuseExistingServer: true,
          timeout: 120_000,
        },
      ],
});
