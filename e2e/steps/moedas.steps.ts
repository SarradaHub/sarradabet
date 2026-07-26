import { When, Then } from "../fixtures/fixtures";
import { CoinsPage } from "../pages/coins.page";

When("compro o primeiro pacote com Pix", async ({ page }) => {
  await new CoinsPage(page).buyFirstPackageWithPix();
});

Then("devo ver o pagamento Pix pendente", async ({ page }) => {
  await new CoinsPage(page).expectPixPaymentVisible();
});

When("simulo pagamento aprovado", async ({ page }) => {
  await new CoinsPage(page).simulateApprovedPayment();
});

Then("devo ver meu saldo de moedas", async ({ page }) => {
  await new CoinsPage(page).expectBalanceVisible();
});

Then("devo ver o histórico de transações", async ({ page }) => {
  await new CoinsPage(page).expectTransactionHistoryVisible();
});
