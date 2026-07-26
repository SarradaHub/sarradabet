import { expect, type Page } from "@playwright/test";

export class AdminDashboardPage {
  constructor(private readonly page: Page) {}

  async expectLoaded(): Promise<void> {
    await expect(this.page.getByText("Total de Apostas").first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(this.page.getByText("Total de Votos").first()).toBeVisible();
    await expect(this.page.getByText("Apostas Ativas").first()).toBeVisible();
    await expect(
      this.page.locator("p.uppercase").filter({ hasText: "Categorias" }),
    ).toBeVisible();
  }

  async expectQuickActionsVisible(): Promise<void> {
    await expect(
      this.page.getByRole("button", { name: "Gerenciar Apostas" }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("button", { name: "Nova Aposta" }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("button", { name: "Nova Categoria" }),
    ).toBeVisible();
  }
}
