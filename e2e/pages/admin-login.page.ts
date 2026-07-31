import { expect, type Locator, type Page } from "@playwright/test";

export class AdminLoginPage {
  readonly heading: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole("heading", { name: "Admin Login" });
    this.usernameInput = page.getByRole("textbox", {
      name: /Usuário ou Email/i,
    });
    this.passwordInput = page.getByRole("textbox", { name: /^Senha/i });
    this.submitButton = page.getByRole("button", { name: "Entrar" });
  }

  async goto(): Promise<void> {
    await this.page.goto("/admin/login");
    await expect(this.heading).toBeVisible({ timeout: 30_000 });
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
