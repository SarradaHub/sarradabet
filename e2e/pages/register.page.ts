import { expect, type Locator, type Page } from "@playwright/test";

export class RegisterPage {
  readonly heading: Locator;
  readonly submitButton: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole("heading", { name: "Criar conta" });
    this.submitButton = page.getByRole("button", { name: "Cadastrar" });
  }

  async goto(): Promise<void> {
    await this.page.goto("/register");
    await expect(this.heading).toBeVisible();
  }

  async fillField(field: string, value: string): Promise<void> {
    await this.page.getByRole("textbox", { name: new RegExp(field, "i") }).fill(value);
  }

  async register(data: {
    username: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<void> {
    await this.fillField("Usuário", data.username);
    await this.fillField("E-mail", data.email);
    await this.fillField("Telefone", data.phone);
    await this.fillField("Senha", data.password);
    await this.submitButton.click();
  }
}
