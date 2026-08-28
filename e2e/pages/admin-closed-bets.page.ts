import { expect, type Page } from "@playwright/test";

export class AdminClosedBetsPage {
  constructor(private readonly page: Page) {}

  private betRow(title: string) {
    return this.page.getByRole("row").filter({ hasText: title });
  }

  async expectBetVisible(title: string): Promise<void> {
    await expect(this.betRow(title)).toBeVisible({ timeout: 15_000 });
  }

  async expectBetNotVisible(title: string): Promise<void> {
    await expect(this.betRow(title)).not.toBeVisible({ timeout: 10_000 });
  }

  async resolveBet(title: string, winningOdd: string): Promise<void> {
    const row = this.betRow(title);
    await row.getByRole("button", { name: `Resolver ${title}` }).click();
    await this.page
      .getByRole("button")
      .filter({ has: this.page.getByText(winningOdd, { exact: true }) })
      .click();
    await this.page.getByRole("button", { name: "Confirmar Resolução" }).click();
  }
}
