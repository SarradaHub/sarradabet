import { expect, type Locator, type Page } from "@playwright/test";

export class CoinsPage {
  readonly heading: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole("heading", { name: "Minhas moedas" });
  }

  async goto(): Promise<void> {
    await this.page.goto("/coins");
    await expect(this.heading).toBeVisible({ timeout: 15_000 });
  }

  async getBalanceText(): Promise<string> {
    const balanceLine = this.page.getByText(/Saldo atual:/);
    return (await balanceLine.textContent()) ?? "";
  }

  async buyFirstPackageWithPix(): Promise<void> {
    await this.page
      .getByRole("button", { name: "Comprar com Pix" })
      .first()
      .click();
    await expect(
      this.page.getByRole("heading", { name: "Pagamento Pix" }),
    ).toBeVisible({ timeout: 15_000 });
  }

  async selectInstoreChannel(): Promise<void> {
    await this.page.getByRole("button", { name: "QR presencial" }).click();
  }

  async buyFirstPackageWithInstoreQr(): Promise<void> {
    await this.selectInstoreChannel();
    await this.page
      .getByRole("button", { name: "Comprar com QR presencial" })
      .first()
      .click();
    await expect(
      this.page.getByRole("heading", { name: "Pagamento QR presencial" }),
    ).toBeVisible({ timeout: 15_000 });
  }

  async expectInstorePaymentVisible(): Promise<void> {
    await expect(
      this.page.getByRole("heading", { name: "Pagamento QR presencial" }),
    ).toBeVisible();
    await expect(this.page.getByText("Aguardando pagamento")).toBeVisible();
  }

  async expectPixPaymentVisible(): Promise<void> {
    await expect(
      this.page.getByRole("heading", { name: "Pagamento Pix" }),
    ).toBeVisible();
    await expect(this.page.getByText("Aguardando pagamento")).toBeVisible();
  }

  async expectBalanceVisible(): Promise<void> {
    await expect(this.page.getByText(/Saldo atual:/)).toBeVisible({
      timeout: 15_000,
    });
  }

  async expectTransactionHistoryVisible(): Promise<void> {
    await expect(this.page.getByRole("heading", { name: "Histórico" })).toBeVisible();
  }

  async expectTransactionWithSource(source: string): Promise<void> {
    await expect(this.page.getByText(source)).toBeVisible({ timeout: 15_000 });
  }

  async simulateApprovedPayment(): Promise<void> {
    await this.page
      .getByRole("button", { name: "Simular pagamento aprovado" })
      .click();
    await expect(
      this.page.getByText("Pagamento confirmado! Suas moedas foram creditadas."),
    ).toBeVisible({ timeout: 15_000 });
  }
}
