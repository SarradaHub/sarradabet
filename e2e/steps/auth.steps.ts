import { expect } from "@playwright/test";
import { Given, When, loginViaUi } from "../fixtures/fixtures";
import { LoginPage } from "../pages/login.page";
import { RegisterPage } from "../pages/register.page";
import { AdminLoginPage } from "../pages/admin-login.page";
import type { SeedRole } from "../fixtures/seed";
import { setCurrentRole } from "../fixtures/session-state";

Given("que estou na página de login", async ({ page }) => {
  await new LoginPage(page).goto();
});

Given("que estou na página de cadastro", async ({ page }) => {
  await new RegisterPage(page).goto();
});

Given("que estou na página de login admin", async ({ page }) => {
  await new AdminLoginPage(page).goto();
});

Given("que estou logado como {string}", async ({ page }, role: string) => {
  const seedRole = role as SeedRole;
  setCurrentRole(seedRole);
  if (seedRole === "admin") {
    await loginViaUi(page, "admin", true);
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 15_000 });
    return;
  }
  await loginViaUi(page, seedRole, false);
  await expect(page.getByRole("button", { name: "Sair" })).toBeVisible({
    timeout: 15_000,
  });
});

When("registro um novo usuário de teste", async ({ page }) => {
  const suffix = Date.now();
  await new RegisterPage(page).register({
    username: `e2euser${suffix}`,
    email: `e2e${suffix}@test.com`,
    phone: `55119${String(suffix).slice(-8)}`,
    password: "password123",
  });
});
