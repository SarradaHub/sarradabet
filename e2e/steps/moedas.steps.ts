import { When, Then } from "../fixtures/fixtures";
import { CoinsPage } from "../pages/coins.page";

When("aceito o aviso financeiro", async ({ page }) => {
  await new CoinsPage(page).acknowledgeFinancialDisclaimer();
});

When("compro o primeiro pacote com Pix", async ({ page }) => {
  await new CoinsPage(page).buyFirstPackageWithPix();
});

Then("devo ver o pagamento Pix pendente", async ({ page }) => {
  await new CoinsPage(page).expectPixPaymentVisible();
});

Then("devo ver a mensagem de comprovante Pix", async ({ page }) => {
  await new CoinsPage(page).expectComprovanteMessageVisible();
});

Then("devo ver a chave Pix estática", async ({ page }) => {
  await new CoinsPage(page).expectStaticPixKeyVisible();
});

Then("devo ver meu saldo de moedas", async ({ page }) => {
  await new CoinsPage(page).expectBalanceVisible();
});

Then("devo ver o histórico de transações", async ({ page }) => {
  await new CoinsPage(page).expectTransactionHistoryVisible();
});
