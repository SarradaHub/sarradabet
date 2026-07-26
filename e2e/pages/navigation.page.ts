import { expect, type Locator, type Page } from "@playwright/test";

export class NavigationPage {
  constructor(private readonly page: Page) {}

  async clickNav(label: string): Promise<void> {
    await this.page.getByRole("button", { name: label }).click();
  }

  async clickLink(label: string): Promise<void> {
    await this.page.getByRole("link", { name: label }).click();
  }

  async expectLoginVisible(): Promise<void> {
    await expect(
      this.page.getByRole("button", { name: "Entrar" }),
    ).toBeVisible();
  }

  async expectLogoutVisible(): Promise<void> {
    await expect(this.page.getByRole("button", { name: "Sair" })).toBeVisible();
  }

  async logout(): Promise<void> {
    await this.clickNav("Sair");
  }
}
