import { expect, type Page } from "@playwright/test";

export class AdminCategoriesPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("about:blank");
    const categoriesResponse = this.page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/categories") &&
        response.request().method() === "GET" &&
        response.ok(),
      { timeout: 15_000 },
    );
    await this.page.goto("/admin/categories");
    await categoriesResponse;
    await expect(
      this.page.getByRole("heading", { name: "Categorias" }),
    ).toBeVisible({ timeout: 15_000 });
  }

  async openCreateModal(): Promise<void> {
    await this.page.getByRole("button", { name: "Nova Categoria" }).click();
    await expect(
      this.page.getByRole("dialog").getByText("Nova categoria"),
    ).toBeVisible();
  }

  async createCategory(title: string): Promise<void> {
    await this.openCreateModal();
    const dialog = this.page.getByRole("dialog");
    await dialog.locator("#title").fill(title);
    await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.url().includes("/api/v1/categories") &&
          response.request().method() === "POST" &&
          response.ok(),
        { timeout: 15_000 },
      ),
      dialog.getByRole("button", { name: "Criar categoria" }).click(),
    ]);
    await expect(this.page.locator("tbody").getByText(title)).toBeVisible({
      timeout: 10_000,
    });
  }

  async expectCategoryVisible(title: string): Promise<void> {
    await expect(this.page.locator("tbody").getByText(title)).toBeVisible({
      timeout: 10_000,
    });
  }

  async editCategory(currentTitle: string, newTitle: string): Promise<void> {
    await this.page
      .getByRole("button", { name: `Editar ${currentTitle}` })
      .click();
    const dialog = this.page.getByRole("dialog", { name: "Editar categoria" });
    await expect(dialog).toBeVisible();
    const titleInput = dialog.locator("#edit-cat-title");
    await titleInput.clear();
    await titleInput.fill(newTitle);
    await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.url().includes("/api/v1/categories") &&
          response.request().method() === "PUT" &&
          response.ok(),
        { timeout: 15_000 },
      ),
      dialog.getByRole("button", { name: "Salvar" }).click(),
    ]);
    await expect(dialog).not.toBeVisible({ timeout: 10_000 });
    await this.page.reload();
    await expect(
      this.page.getByRole("heading", { name: "Categorias" }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(this.page.locator("tbody").getByText(newTitle)).toBeVisible({
      timeout: 10_000,
    });
  }

  async deleteCategory(title: string): Promise<void> {
    await this.page
      .getByRole("button", { name: `Excluir ${title}` })
      .click();
    await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.url().includes("/api/v1/categories") &&
          response.request().method() === "DELETE" &&
          response.ok(),
        { timeout: 15_000 },
      ),
      this.page
        .getByRole("dialog", { name: "Excluir categoria" })
        .getByRole("button", { name: "Excluir", exact: true })
        .click(),
    ]);
    await this.page.reload();
    await expect(
      this.page.getByRole("heading", { name: "Categorias" }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      this.page.locator("tbody").getByText(title),
    ).not.toBeVisible({ timeout: 10_000 });
  }

  async expectDeleteError(): Promise<void> {
    await expect(
      this.page.getByText(/Cannot delete category that has bets/i),
    ).toBeVisible({ timeout: 10_000 });
  }
}
