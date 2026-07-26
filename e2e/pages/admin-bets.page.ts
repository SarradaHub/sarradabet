import { expect, type Locator, type Page } from "@playwright/test";

export class AdminBetsPage {
  readonly statusFilter: Locator;

  constructor(private readonly page: Page) {
    this.statusFilter = page.getByLabel("Status");
  }

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

  async expectBetVisible(title: string): Promise<void> {
    await expect(this.page.getByText(title)).toBeVisible({ timeout: 15_000 });
  }

  async expectBetNotVisible(title: string): Promise<void> {
    await expect(this.page.getByText(title)).not.toBeVisible({ timeout: 10_000 });
  }

  async filterByStatus(label: string): Promise<void> {
    await this.statusFilter.selectOption({ label });
  }

  async openCreateModal(): Promise<void> {
    await this.page.getByRole("button", { name: "Nova Aposta" }).click();
    await expect(
      this.page.getByRole("dialog").getByRole("heading", { name: "Criar mercado" }),
    ).toBeVisible();
  }

  async createBet(data: {
    title: string;
    description: string;
    category: string;
    odds: string[];
  }): Promise<void> {
    await this.openCreateModal();
    const dialog = this.page.getByRole("dialog");
    await dialog.getByLabel("Título").fill(data.title);
    await dialog.getByLabel("Descrição").fill(data.description);
    await dialog.getByLabel("Categoria").selectOption({ label: data.category });

    const oddInputs = dialog.getByPlaceholder(/Opção \d+/);
    for (let index = 0; index < data.odds.length; index++) {
      await oddInputs.nth(index).fill(data.odds[index] ?? "");
    }

    await dialog.getByRole("button", { name: "Criar mercado" }).click();
    await expect(this.page.getByText(data.title)).toBeVisible({
      timeout: 15_000,
    });
  }

  async closeBet(title: string): Promise<void> {
    const row = this.page.getByRole("row").filter({ hasText: title });
    await row.getByRole("button", { name: `Fechar ${title}` }).click();
    await this.page
      .getByRole("dialog", { name: "Fechar aposta" })
      .getByRole("button", { name: "Fechar", exact: true })
      .click();
    await expect(row.getByText("Fechada")).toBeVisible({ timeout: 10_000 });
  }

  async resolveBet(title: string, winningOdd: string): Promise<void> {
    const row = this.page.getByRole("row").filter({ hasText: title });
    await row.getByRole("button", { name: `Resolver ${title}` }).click();
    const dialog = this.page.getByRole("dialog");
    await dialog.getByRole("button", { name: winningOdd }).click();
    await dialog.getByRole("button", { name: "Resolver" }).click();
    await expect(row.getByText("Resolvida")).toBeVisible({ timeout: 10_000 });
  }

  async deleteBet(title: string): Promise<void> {
    const row = this.page.getByRole("row").filter({ hasText: title });
    await row.getByRole("button", { name: `Excluir ${title}` }).click();
    await this.page
      .getByRole("dialog", { name: "Excluir aposta" })
      .getByRole("button", { name: "Excluir", exact: true })
      .click();
    await expect(row).not.toBeVisible({ timeout: 10_000 });
  }

  async expectBetCountAtLeast(count: number): Promise<void> {
    const rows = this.page.locator("tbody tr").filter({
      hasNotText: "Nenhuma aposta encontrada",
    });
    await expect(rows).toHaveCount(count, { timeout: 15_000 });
  }
}
