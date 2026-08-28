import { expect } from "@playwright/test";
import { Given, When, Then } from "../fixtures/fixtures";
import { HomePage } from "../pages/home.page";
import {
  createClosedTestBetViaApi,
} from "../fixtures/seed";
import { setClosedBet, getClosedBet } from "../fixtures/test-data-state";

Given("que estou na página inicial", async ({ page }) => {
  const home = new HomePage(page);
  await home.goto();
  await home.expectMarketsVisible();
});

async function seedClosedTestBet(): Promise<void> {
  setClosedBet(await createClosedTestBetViaApi());
}

Given("que existe uma aposta fechada de teste via API", seedClosedTestBet);
Given("existe uma aposta fechada de teste via API", seedClosedTestBet);

Then("devo ver o mercado {string}", async ({ page }, title: string) => {
  await expect(page.getByText(title)).toBeVisible({ timeout: 15_000 });
});

Then("não devo ver o mercado {string}", async ({ page }, title: string) => {
  await new HomePage(page).expectMarketNotVisible(title);
});

Then("não devo ver o mercado da aposta fechada de teste", async ({ page }) => {
  const bet = getClosedBet();
  expect(bet?.title).toBeTruthy();
  await new HomePage(page).expectMarketNotVisible(bet!.title);
});

When(
  "navego para a categoria {string} da aposta fechada de teste",
  async ({ page }, _categoryTitle: string) => {
    const bet = getClosedBet();
    expect(bet?.categoryId).toBeTruthy();
    await page.goto(`/category/${bet!.categoryId}`);
    await page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/bets") && response.status() === 200,
      { timeout: 30_000 },
    );
    await expect(page.getByText(bet!.title)).toBeVisible({ timeout: 15_000 });
  },
);

When("seleciono a odd {string}", async ({ page }, oddTitle: string) => {
  await new HomePage(page).selectOddByTitle(oddTitle);
});

When("filtro mercados pela categoria {string}", async ({ page }, category: string) => {
  await page.getByRole("link", { name: new RegExp(category, "i") }).first().click();
});

Then("a odd {string} deve aparecer no cupom", async ({ page }, oddTitle: string) => {
  await new HomePage(page).expectSelectionInSlip(oddTitle);
});

When("confirmo os votos", async ({ page }) => {
  await new HomePage(page).confirmVotes();
});

Then(
  "a odd {string} da aposta fechada deve estar desabilitada",
  async ({ page }, oddTitle: string) => {
    const bet = getClosedBet();
    await new HomePage(page).expectOddDisabledForBet(bet?.title, oddTitle);
  },
);
