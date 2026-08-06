import { When, Then } from "../fixtures/fixtures";
import { AdminPaymentsPage } from "../pages/admin-payments.page";

When(
  "gero QR presencial para o usuário {string} com pacote {string}",
  async ({ page }, username: string, packageName: string) => {
    await new AdminPaymentsPage(page).generateQrForUser(username, packageName);
  },
);

When("simulo pagamento aprovado no caixa", async ({ page }) => {
  await new AdminPaymentsPage(page).simulateApprovedPayment();
});

When("abro o monitoramento de pagamentos", async ({ page }) => {
  await new AdminPaymentsPage(page).expectPaymentMonitorVisible();
});

Then("devo ver o pagamento QR presencial no caixa", async ({ page }) => {
  await page
    .getByRole("heading", { name: "Pagamento QR presencial" })
    .waitFor({ state: "visible", timeout: 10_000 });
});

Then("devo ver a tabela de pagamentos", async ({ page }) => {
  await page.getByRole("columnheader", { name: "Canal" }).waitFor({
    state: "visible",
    timeout: 10_000,
  });
});
