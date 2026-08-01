import { expect, type Page } from "@playwright/test";

type CreateBetOptions = {
  title: string;
  description: string;
  category: string;
  odds: string[];
};

export class AdminBetsPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    const betsResponse = this.page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/bets") &&
        response.request().method() === "GET" &&
        response.ok(),
      { timeout: 15_000 },
    );
    await this.page.goto("/admin/bets");
    await betsResponse;
    await expect(
      this.page.getByRole("button", { name: "Nova Aposta" }),
    ).toBeVisible({ timeout: 15_000 });
  }

  private betRow(title: string) {
    return this.page.getByRole("row").filter({ hasText: title });
  }

  async filterByStatus(statusLabel: string): Promise<void> {
    await this.page.locator("#status-filter").selectOption({ label: statusLabel });
  }

  async createBet(options: CreateBetOptions): Promise<void> {
    await this.page.getByRole("button", { name: "Nova Aposta" }).click();
    await expect(
      this.page.getByRole("heading", { name: "Criar mercado" }),
    ).toBeVisible();

    await this.page.getByLabel("Título").fill(options.title);
    await this.page.getByLabel("Descrição").fill(options.description);
    await this.page.locator("#category").selectOption({ label: options.category });

    for (let i = 0; i < options.odds.length; i++) {
      if (i >= 2) {
        await this.page.getByRole("button", { name: "Adicionar" }).click();
      }
      await this.page.getByPlaceholder(`Opção ${i + 1}`).fill(options.odds[i]);
    }

    await this.page.getByRole("button", { name: "Criar mercado" }).click();
    await expect(this.page.getByText(options.title)).toBeVisible({
      timeout: 15_000,
    });
  }

  async closeBet(title: string): Promise<void> {
    const row = this.betRow(title);
    await row.getByRole("button", { name: `Fechar ${title}` }).click();
    await this.page
      .getByRole("dialog", { name: "Fechar aposta" })
      .getByRole("button", { name: "Fechar", exact: true })
      .click();
    await expect(row.getByText("Fechada")).toBeVisible({ timeout: 10_000 });
  }

  async resolveBet(title: string, winningOdd: string): Promise<void> {
    const row = this.betRow(title);
    await row.getByRole("button", { name: `Resolver ${title}` }).click();
    await this.page
      .getByRole("button")
      .filter({ has: this.page.getByText(winningOdd, { exact: true }) })
      .click();
    await this.page.getByRole("button", { name: "Resolver" }).click();
    await expect(row.getByText("Resolvida")).toBeVisible({ timeout: 10_000 });
  }

  async deleteBet(title: string): Promise<void> {
    const row = this.betRow(title);
    await row.getByRole("button", { name: `Excluir ${title}` }).click();
    await this.page
      .getByRole("dialog", { name: "Excluir aposta" })
      .getByRole("button", { name: "Excluir", exact: true })
      .click();
    await expect(row).not.toBeVisible({ timeout: 10_000 });
  }

  async expectBetVisible(title: string): Promise<void> {
    await expect(this.betRow(title)).toBeVisible({ timeout: 15_000 });
  }

  async expectBetNotVisible(title: string): Promise<void> {
    await expect(this.betRow(title)).not.toBeVisible({ timeout: 10_000 });
  }
}
