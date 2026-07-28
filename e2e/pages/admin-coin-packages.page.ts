import { expect, type Page } from "@playwright/test";

export class AdminCoinPackagesPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/admin/coin-packages");
    await expect(this.page).toHaveURL(/\/admin\/coin-packages/, {
      timeout: 15_000,
    });
  }
}
