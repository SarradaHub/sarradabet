import { Then, When } from "../fixtures/fixtures";
import { expect } from "@playwright/test";
import { loginViaApi } from "../fixtures/seed";
import { getCurrentRole } from "../fixtures/session-state";

const API_URL = process.env.E2E_API_URL ?? "http://localhost:8000";

let lastAnalyticsStatus = 0;
let lastAnalyticsBody: Record<string, unknown> = {};

When("acesso a página {string}", async ({ page }, path: string) => {
  await page.goto(path);
});

When(
  "consulto a overview analítica de {string} até {string}",
  async (_context, startDate: string, endDate: string) => {
    const token = await loginViaApi(getCurrentRole());
    const response = await fetch(
      `${API_URL}/api/v1/admin/analytics/overview?startDate=${startDate}&endDate=${endDate}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    lastAnalyticsStatus = response.status;
    lastAnalyticsBody = (await response.json()) as Record<string, unknown>;
  },
);

Then(
  "a resposta analítica contém {string}",
  async (_context, field: string) => {
    const data = lastAnalyticsBody.data as Record<string, unknown> | undefined;
    expect(data).toBeTruthy();
    expect(data?.[field]).toBeDefined();
  },
);

Then("a resposta HTTP analítica é {int}", async (_context, status: number) => {
  expect(lastAnalyticsStatus).toBe(status);
});
