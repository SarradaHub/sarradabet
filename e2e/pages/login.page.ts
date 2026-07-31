import { expect, type Locator, type Page } from "@playwright/test";

export class LoginPage {
  readonly heading: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole("heading", { name: "Entrar" });
    this.usernameInput = page.getByRole("textbox", {
      name: /Usuário ou e-mail/i,
    });
    this.passwordInput = page.getByRole("textbox", { name: /^Senha/i });
    this.submitButton = page.getByRole("button", { name: "Entrar" });
  }

  async goto(): Promise<void> {
    await this.page.goto("/login");
    await expect(this.heading).toBeVisible();
  }

  async fillField(field: string, value: string): Promise<void> {
    const map: Record<string, Locator> = {
      "Usuário ou e-mail": this.usernameInput,
      Senha: this.passwordInput,
      username: this.usernameInput,
      password: this.passwordInput,
    };
    const input = map[field];
    if (!input) {
      throw new Error(`Campo desconhecido: ${field}`);
    }
    await input.fill(value);
  }

  async login(username: string, password: string): Promise<void> {
    await this.fillField("Usuário ou e-mail", username);
    await this.fillField("Senha", password);
    await this.submitButton.click();
  }

  async clickButton(label: string): Promise<void> {
    await this.page.getByRole("button", { name: label }).click();
  }
}
