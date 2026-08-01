import { Then } from "../fixtures/fixtures";
import { expect } from "@playwright/test";

Then("devo ver o título {string}", async ({ page }, title: string) => {
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible({ timeout: 10_000 });
});
