import { expect, type Page } from "@playwright/test";

export class AdminRewardsPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/admin/rewards");
    await expect(this.page).toHaveURL(/\/admin\/rewards/, { timeout: 15_000 });
  }
}
