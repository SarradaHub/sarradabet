import { expect, type Page } from "@playwright/test";

export class AdminUsersPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/admin/users");
    await expect(
      this.page.getByRole("heading", { name: "Usuários" }),
    ).toBeVisible({ timeout: 15_000 });
  }

  async expectUserVisible(username: string): Promise<void> {
    await expect(
      this.page.getByRole("cell", { name: username, exact: true }),
    ).toBeVisible({ timeout: 15_000 });
  }

  async expectUserNotVisible(username: string): Promise<void> {
    await expect(
      this.page.getByRole("cell", { name: username, exact: true }),
    ).not.toBeVisible({ timeout: 10_000 });
  }

  async deleteUser(username: string): Promise<void> {
    const row = this.page
      .getByRole("row")
      .filter({ has: this.page.getByRole("cell", { name: username, exact: true }) });
    await row.getByRole("button", { name: "Excluir" }).click();
    await this.page
      .getByRole("dialog")
      .getByRole("button", { name: "Excluir" })
      .click();
    await expect(row).not.toBeVisible({ timeout: 10_000 });
  }

  async expectDeleteDisabled(username: string): Promise<void> {
    const button = this.page
      .getByRole("row")
      .filter({ has: this.page.getByRole("cell", { name: username, exact: true }) })
      .getByRole("button", { name: "Excluir" });
    await expect(button).toBeDisabled();
  }
}
