import { expect } from "@playwright/test";
import { Given, When, Then } from "../fixtures/fixtures";
import { HomePage } from "../pages/home.page";
import {
  closeBetViaApi,
  createBetViaApi,
  getCategoryIdByTitle,
  loginViaApi,
} from "../fixtures/seed";
import { setClosedBet, getClosedBet } from "../fixtures/test-data-state";

Given("que estou na página inicial", async ({ page }) => {
  const home = new HomePage(page);
  await home.goto();
  await home.expectMarketsVisible();
});

Given("que existe uma aposta fechada de teste via API", async () => {
  const adminToken = await loginViaApi("admin");
  const categoryId = await getCategoryIdByTitle("Futebol");
  const suffix = Date.now();
  const bet = await createBetViaApi(adminToken, {
    title: `E2EClosedBet${suffix}`,
    description: "Aposta fechada para testes E2E",
    categoryId,
    odds: [{ title: "Opcao A" }, { title: "Opcao B" }],
  });
  await closeBetViaApi(adminToken, bet.id);
  setClosedBet(bet);
});

Then("devo ver o mercado {string}", async ({ page }, title: string) => {
  await expect(page.getByText(title)).toBeVisible({ timeout: 15_000 });
});

Then("não devo ver o mercado {string}", async ({ page }, title: string) => {
  await new HomePage(page).expectMarketNotVisible(title);
});

When("seleciono a odd {string}", async ({ page }, oddTitle: string) => {
  await new HomePage(page).selectOddByTitle(oddTitle);
});

When("filtro mercados pela categoria {string}", async ({ page }, category: string) => {
  await new HomePage(page).filterByCategory(category);
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
