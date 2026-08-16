import { expect } from "@playwright/test";
import { Given, When, Then } from "../fixtures/fixtures";
import { LoginPage } from "../pages/login.page";
import { RegisterPage } from "../pages/register.page";
import { NavigationPage } from "../pages/navigation.page";
import { AdminBetsPage } from "../pages/admin-bets.page";
import { AdminCategoriesPage } from "../pages/admin-categories.page";
import { AdminUsersPage } from "../pages/admin-users.page";
import { AdminCoinPackagesPage } from "../pages/admin-coin-packages.page";
import { AdminRewardsPage } from "../pages/admin-rewards.page";

Given("que não estou autenticado", async ({ page }) => {
  await page.context().clearCookies();
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.goto("/");
});

When("navego para {string}", async ({ page }, path: string) => {
  if (path === "/admin/bets") {
    await new AdminBetsPage(page).goto();
    return;
  }
  if (path === "/admin/categories") {
    await new AdminCategoriesPage(page).goto();
    return;
  }
  if (path === "/admin/users") {
    await new AdminUsersPage(page).goto();
    return;
  }
  if (path === "/admin/coin-packages") {
    await new AdminCoinPackagesPage(page).goto();
    return;
  }
  if (path === "/admin/rewards") {
    await new AdminRewardsPage(page).goto();
    return;
  }

  await page.goto(path);
});

When("preencho {string} com {string}", async ({ page }, field: string, value: string) => {
  const loginPage = new LoginPage(page);
  const onAdminLogin = await page
    .getByRole("heading", { name: "Admin Login" })
    .isVisible()
    .catch(() => false);

  if (onAdminLogin) {
    if (field === "Usuário ou Email" || field === "Usuário ou e-mail") {
      await page.getByRole("textbox", { name: /Usuário ou/i }).fill(value);
      return;
    }
    if (field === "Senha") {
      await page.getByRole("textbox", { name: /^Senha/i }).fill(value);
      return;
    }
  }

  const onRegister = await page
    .getByRole("heading", { name: "Criar conta" })
    .isVisible()
    .catch(() => false);

  if (onRegister) {
    await new RegisterPage(page).fillField(field, value);
    return;
  }

  await loginPage.fillField(field, value);
});

When("clico em {string}", async ({ page }, label: string) => {
  const link = page.getByRole("link", { name: label, exact: true });
  if (await link.isVisible().catch(() => false)) {
    await link.click();
    return;
  }

  const navigation = new NavigationPage(page);
  const button = page.getByRole("button", { name: label });
  if (await button.isVisible().catch(() => false)) {
    await navigation.clickNav(label);
    return;
  }

  await page.getByRole("link", { name: label, exact: true }).click();
});

Then("devo ver a URL contendo {string}", async ({ page }, fragment: string) => {
  await expect(page).toHaveURL(new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

Then("devo ver o texto {string}", async ({ page }, text: string) => {
  await expect(page.getByText(text, { exact: false })).toBeVisible({
    timeout: 10_000,
  });
});

Then("devo ver o botão {string}", async ({ page }, label: string) => {
  const link = page.getByRole("link", { name: label, exact: true });
  const button = page.getByRole("button", { name: label });

  await expect(link.or(button)).toBeVisible({ timeout: 15_000 });
});

Then("não devo ver o botão {string}", async ({ page }, label: string) => {
  await expect(page.getByRole("button", { name: label })).not.toBeVisible();
});

Then("devo ver o link {string}", async ({ page }, label: string) => {
  await expect(page.getByRole("link", { name: label, exact: true })).toBeVisible({
    timeout: 15_000,
  });
});
