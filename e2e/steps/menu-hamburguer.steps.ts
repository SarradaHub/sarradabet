import { expect } from "@playwright/test";
import { Given, When, Then } from "../fixtures/fixtures";
import { NavigationPage } from "../pages/navigation.page";

const MOBILE_VIEWPORT = { width: 375, height: 667 };
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

Given("que a viewport está em modo mobile", async ({ page }) => {
  await page.setViewportSize(MOBILE_VIEWPORT);
});

Given("que a viewport está em modo desktop", async ({ page }) => {
  await page.setViewportSize(DESKTOP_VIEWPORT);
});

Given("o menu de navegação está fechado", async ({ page }) => {
  const navigation = new NavigationPage(page);
  await navigation.expectMenuClosed();
});

Given("o menu de navegação está aberto", async ({ page }) => {
  const navigation = new NavigationPage(page);
  await navigation.openMobileMenu();
  await navigation.expectMenuOpen();
});

Given("o sistema tem movimento reduzido ativado", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

When("abro o menu de navegação", async ({ page }) => {
  const navigation = new NavigationPage(page);
  await navigation.openMobileMenu();
});

When("fecho o menu de navegação pelo overlay", async ({ page }) => {
  const navigation = new NavigationPage(page);
  await navigation.closeMobileMenuViaOverlay();
});

When('pressiono a tecla "Escape"', async ({ page }) => {
  await page.keyboard.press("Escape");
});

When('clico no link {string} do menu lateral', async ({ page }, label: string) => {
  const navigation = new NavigationPage(page);
  await navigation.clickDrawerLink(label);
});

Then("o ícone do hambúrguer deve estar expandido", async ({ page }) => {
  const navigation = new NavigationPage(page);
  await navigation.expectHamburgerExpanded(true);
});

Then("o ícone do hambúrguer deve estar recolhido", async ({ page }) => {
  const navigation = new NavigationPage(page);
  await navigation.expectHamburgerExpanded(false);
});

Then("o menu lateral deve estar visível", async ({ page }) => {
  const navigation = new NavigationPage(page);
  await navigation.expectDrawerVisible();
});

Then("o menu lateral não deve estar visível", async ({ page }) => {
  const navigation = new NavigationPage(page);
  await navigation.expectDrawerHidden();
});

Then("o overlay do menu deve estar visível", async ({ page }) => {
  const navigation = new NavigationPage(page);
  await navigation.expectOverlayVisible();
});

Then("o botão hambúrguer não deve estar visível", async ({ page }) => {
  const navigation = new NavigationPage(page);
  await navigation.expectHamburgerHidden();
});

Then('devo ver o link {string} na barra de navegação', async ({ page }, label: string) => {
  await expect(
    page.getByRole("navigation", { name: "Navegação principal" }).getByRole("link", {
      name: label,
    }),
  ).toBeVisible();
});

Then("devo ver o saldo de moedas no cabeçalho", async ({ page }) => {
  await expect(page.getByRole("link", { name: /moedas disponíveis/i })).toBeVisible();
});

Then('o link {string} deve estar marcado como página atual', async ({ page }, label: string) => {
  await expect(
    page.getByRole("link", { name: label, exact: true }),
  ).toHaveAttribute("aria-current", "page");
});
