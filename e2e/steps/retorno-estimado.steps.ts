import { expect } from "@playwright/test";
import { When, Then } from "../fixtures/fixtures";
import { HomePage } from "../pages/home.page";

Then("devo ver {string} no cupom", async ({ page }, text: string) => {
  await expect(page.getByText(text)).toBeVisible();
});

When(
  "abro a explicação {string}",
  async ({ page }, label: string) => {
    await new HomePage(page).openReturnExplainer(label);
  },
);
