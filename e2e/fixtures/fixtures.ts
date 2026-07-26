import { createBdd, test as bddTest } from "playwright-bdd";
import { LoginPage } from "../pages/login.page";
import { AdminLoginPage } from "../pages/admin-login.page";
import { SEED_USERS, type SeedRole } from "./seed";

export const test = bddTest;

export const { Given, When, Then, Before, After } = createBdd(test);

export async function loginViaUi(
  page: import("@playwright/test").Page,
  role: SeedRole,
  admin = false,
): Promise<void> {
  const credentials = SEED_USERS[role];
  if (admin) {
    const adminLogin = new AdminLoginPage(page);
    await adminLogin.goto();
    await adminLogin.login(credentials.username, credentials.password);
    return;
  }

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(credentials.username, credentials.password);
}
