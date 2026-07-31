import { expect, type Page } from "@playwright/test";

export class AdminCoinPackagesPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/admin/coin-packages");
    await expect(
      this.page.getByRole("heading", { name: "Pacotes de moedas" }),
    ).toBeVisible({ timeout: 15_000 });
  }

  async createPackage(data: {
    name: string;
    amountReais: string;
    coinsAmount: string;
  }): Promise<void> {
    await this.page.getByPlaceholder("Nome do pacote").fill(data.name);
    await this.page.getByPlaceholder("Preço em reais").fill(data.amountReais);
    await this.page
      .getByPlaceholder("Quantidade de moedas")
      .fill(data.coinsAmount);
    await this.page.getByRole("button", { name: "Criar pacote" }).click();
    await expect(this.page.getByText(data.name)).toBeVisible({
      timeout: 10_000,
    });
  }

  async expectPackageVisible(name: string): Promise<void> {
    await expect(this.page.getByText(name)).toBeVisible({ timeout: 10_000 });
  }

  async togglePackageActive(name: string): Promise<void> {
    const card = this.page
      .locator("div.sb-surface.border.rounded-xl")
      .filter({ has: this.page.getByRole("heading", { name, exact: true }) });
    const deactivateButton = card.getByRole("button", { name: "Desativar" });
    const activateButton = card.getByRole("button", { name: "Ativar" });

    if (await deactivateButton.isVisible()) {
      await deactivateButton.click();
      await expect(activateButton).toBeVisible({ timeout: 10_000 });
    }

    await activateButton.click();
    await expect(deactivateButton).toBeVisible({ timeout: 10_000 });
  }
}
