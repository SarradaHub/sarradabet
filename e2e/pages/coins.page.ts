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

  async acknowledgeFinancialDisclaimer(): Promise<void> {
    await this.page.getByRole("checkbox").check();
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

  async expectPixPaymentVisible(): Promise<void> {
    await expect(
      this.page.getByRole("heading", { name: "Pagamento Pix" }),
    ).toBeVisible();
    await expect(
      this.page.getByText("Aguardando confirmação do comprovante"),
    ).toBeVisible();
  }

  async expectComprovanteMessageVisible(): Promise<void> {
    await expect(
      this.page.getByText(
        "Envie o comprovante para o seguinte número (61) 999272342",
      ),
    ).toBeVisible();
  }

  async expectStaticPixKeyVisible(): Promise<void> {
    await expect(
      this.page.getByDisplayValue("33a26506-c657-44ca-a331-ae7dcb256201"),
    ).toBeVisible();
    await expect(this.page.getByAltText("QR Code Pix")).toBeVisible();
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
}
