import type { Page } from "@playwright/test";

export class AdminRewardsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/admin/rewards");
  }
}
