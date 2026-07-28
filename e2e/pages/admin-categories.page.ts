import { expect, type Page } from "@playwright/test";

export class AdminCategoriesPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/admin/categories");
    await expect(
      this.page.getByRole("heading", { name: "Categorias" }),
    ).toBeVisible({ timeout: 15_000 });
  }
}
