import { expect, type Locator, type Page } from "@playwright/test";

export class ProfilePage {
  readonly heading: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole("heading", { name: "Meu perfil" });
  }

  async goto(): Promise<void> {
    await this.page.goto("/profile");
  }

  async expectLoadedForUsername(username: string): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 15_000 });
    const profileCard = this.page.locator(".sb-surface.border.rounded-2xl");
    await expect(
      profileCard.getByText(username, { exact: true }),
    ).toBeVisible();
  }
}
