import { expect, type Page } from "@playwright/test";

export class AdminPaymentsPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/admin/payments");
    await expect(
      this.page.getByRole("heading", { name: "Pagamentos" }),
    ).toBeVisible({ timeout: 15_000 });
  }

  async generateQrForUser(username: string, packageName: string): Promise<void> {
    await this.page.getByRole("button", { name: "Caixa QR" }).click();

    const userSelect = this.page.locator("select").first();
    const userValue = await userSelect
      .locator("option")
      .filter({ hasText: username })
      .first()
      .getAttribute("value");
    if (!userValue) {
      throw new Error(`Usuário ${username} não encontrado no select`);
    }
    await userSelect.selectOption(userValue);

    const packageSelect = this.page.locator("select").nth(1);
    const packageValue = await packageSelect
      .locator("option")
      .filter({ hasText: packageName })
      .first()
      .getAttribute("value");
    if (!packageValue) {
      throw new Error(`Pacote ${packageName} não encontrado no select`);
    }
    await packageSelect.selectOption(packageValue);

    await this.page
      .getByRole("button", { name: "Gerar QR presencial" })
      .click();
    await expect(
      this.page.getByRole("heading", { name: "Pagamento QR presencial" }),
    ).toBeVisible({ timeout: 15_000 });
  }

  async simulateApprovedPayment(): Promise<void> {
    await this.page
      .getByRole("button", { name: "Simular pagamento aprovado" })
      .click();
    await expect(
      this.page.getByText("Pagamento simulado e moedas creditadas."),
    ).toBeVisible({ timeout: 15_000 });
  }

  async expectPaymentMonitorVisible(): Promise<void> {
    await this.page.getByRole("button", { name: "Monitoramento" }).click();
    await expect(this.page.getByRole("columnheader", { name: "Usuário" })).toBeVisible({
      timeout: 10_000,
    });
  }
}
