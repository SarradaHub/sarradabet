import { expect, type Page } from "@playwright/test";

export class NavigationPage {
  constructor(private readonly page: Page) {}

  private hamburgerButton(includeHidden = false) {
    return this.page.getByRole("button", {
      name: "Toggle navigation",
      includeHidden,
    });
  }

  private drawer() {
    return this.page.locator("#navigation-menu");
  }

  async clickNav(label: string): Promise<void> {
    await this.page.getByRole("button", { name: label }).click();
  }

  async clickLink(label: string): Promise<void> {
    await this.page.getByRole("link", { name: label, exact: true }).click();
  }

  async openMobileMenu(): Promise<void> {
    await this.hamburgerButton().click();
  }

  private overlay() {
    return this.page.getByTestId("navigation-menu-overlay");
  }

  async closeMobileMenuViaOverlay(): Promise<void> {
    const viewport = this.page.viewportSize();
    const x = Math.max((viewport?.width ?? 375) - 12, 0);
    await this.page.mouse.click(x, 120);
  }

  async clickDrawerLink(label: string): Promise<void> {
    await this.drawer().getByRole("link", { name: label, exact: true }).click();
  }

  async expectMenuOpen(): Promise<void> {
    await this.expectHamburgerExpanded(true);
    await this.expectDrawerVisible();
  }

  async expectMenuClosed(): Promise<void> {
    await this.expectHamburgerExpanded(false);
    await this.expectDrawerHidden();
  }

  async expectHamburgerExpanded(expanded: boolean): Promise<void> {
    if (expanded) {
      await expect(this.drawer()).toBeVisible();
      await expect(this.hamburgerButton(true)).toHaveAttribute("aria-expanded", "true");
      return;
    }

    await expect(this.hamburgerButton()).toHaveAttribute("aria-expanded", "false");
  }

  async expectDrawerVisible(): Promise<void> {
    await expect(this.drawer()).toBeVisible();
  }

  async expectDrawerHidden(): Promise<void> {
    await expect(this.drawer()).toBeHidden();
  }

  async expectHamburgerHidden(): Promise<void> {
    await expect(this.hamburgerButton()).toBeHidden();
  }

  async expectOverlayVisible(): Promise<void> {
    await expect(this.overlay()).toBeAttached();
  }

  async expectLoginVisible(): Promise<void> {
    await expect(
      this.page.getByRole("link", { name: "Entrar" }),
    ).toBeVisible();
  }

  async expectLogoutVisible(): Promise<void> {
    await expect(this.page.getByRole("button", { name: "Sair" })).toBeVisible();
  }

  async logout(): Promise<void> {
    await this.clickNav("Sair");
  }
}
