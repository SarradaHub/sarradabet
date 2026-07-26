import { Then } from "../fixtures/fixtures";
import { expect } from "@playwright/test";

Then("devo ver o título {string}", async ({ page }, title: string) => {
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible({ timeout: 10_000 });
});

Then("devo ver o texto {string}", async ({ page }, text: string) => {
  await expect(page.getByText(text)).toBeVisible({ timeout: 10_000 });
});
