import { Given, When, Then } from "../fixtures/fixtures";
import { AdminBetsPage } from "../pages/admin-bets.page";
import {
  createBetViaApi,
  getCategoryIdByTitle,
  loginViaApi,
} from "../fixtures/seed";
import {
  clearTestBet,
  getTestBet,
  setTestBet,
} from "../fixtures/test-data-state";

Given("existe uma aposta de teste criada via API", async () => {
  const adminToken = await loginViaApi("admin");
  const categoryId = await getCategoryIdByTitle("Futebol");
  const suffix = Date.now();
  setTestBet(
    await createBetViaApi(adminToken, {
      title: `E2EBet${suffix}`,
      description: "Aposta criada para testes E2E",
      categoryId,
      odds: [{ title: "Opcao A" }, { title: "Opcao B" }],
    }),
  );
});

When("filtro apostas por status {string}", async ({ page }, statusLabel: string) => {
  await new AdminBetsPage(page).filterByStatus(statusLabel);
});

When("crio uma aposta de teste", async ({ page }) => {
  const suffix = Date.now();
  const title = `E2EBetUI${suffix}`;
  await new AdminBetsPage(page).createBet({
    title,
    description: "Aposta criada via UI nos testes E2E",
    category: "Futebol",
    odds: ["Time A", "Time B"],
  });
  setTestBet({ id: 0, title, odds: [] });
});

When("fecho a aposta de teste", async ({ page }) => {
  const bet = getTestBet();
  if (!bet) {
    throw new Error("Aposta de teste não foi criada");
  }
  await new AdminBetsPage(page).closeBet(bet.title);
});

When(
  "resolvo a aposta de teste com a odd {string}",
  async ({ page }, winningOdd: string) => {
    const bet = getTestBet();
    if (!bet) {
      throw new Error("Aposta de teste não foi criada");
    }
    await new AdminBetsPage(page).resolveBet(bet.title, winningOdd);
  },
);

When("excluo a aposta de teste", async ({ page }) => {
  const bet = getTestBet();
  if (!bet) {
    throw new Error("Aposta de teste não foi criada");
  }
  await new AdminBetsPage(page).deleteBet(bet.title);
  clearTestBet();
});

Then("devo ver a aposta {string}", async ({ page }, title: string) => {
  await new AdminBetsPage(page).expectBetVisible(title);
});

Then("devo ver a aposta de teste", async ({ page }) => {
  const bet = getTestBet();
  if (!bet) {
    throw new Error("Aposta de teste não foi criada");
  }
  await new AdminBetsPage(page).expectBetVisible(bet.title);
});

Then("devo ver a aposta de teste resolvida", async ({ page }) => {
  const bet = getTestBet();
  if (!bet) {
    throw new Error("Aposta de teste não foi criada");
  }
  const row = page.getByRole("row").filter({ hasText: bet.title });
  await row.getByText("Resolvida").waitFor({ state: "visible", timeout: 10_000 });
});

Then("a aposta de teste não deve aparecer", async ({ page }) => {
  const bet = getTestBet();
  if (!bet) {
    return;
  }
  await new AdminBetsPage(page).expectBetNotVisible(bet.title);
});
