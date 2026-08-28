import { Then, When } from "../fixtures/fixtures";
import { AdminClosedBetsPage } from "../pages/admin-closed-bets.page";
import { getClosedBet } from "../fixtures/test-data-state";

Then("devo ver a aposta fechada de teste na fila", async ({ page }) => {
  const bet = getClosedBet();
  if (!bet) {
    throw new Error("Aposta fechada de teste não foi criada");
  }
  await new AdminClosedBetsPage(page).expectBetVisible(bet.title);
});

When(
  "resolvo a aposta fechada de teste com a odd {string}",
  async ({ page }, winningOdd: string) => {
    const bet = getClosedBet();
    if (!bet) {
      throw new Error("Aposta fechada de teste não foi criada");
    }
    await new AdminClosedBetsPage(page).resolveBet(bet.title, winningOdd);
  },
);

Then("a aposta fechada de teste não deve aparecer na fila", async ({ page }) => {
  const bet = getClosedBet();
  if (!bet) {
    throw new Error("Aposta fechada de teste não foi criada");
  }
  await new AdminClosedBetsPage(page).expectBetNotVisible(bet.title);
});
