import { When, Then } from "../fixtures/fixtures";
import { AdminCoinPackagesPage } from "../pages/admin-coin-packages.page";

const testPackageName = () => `E2EPackage${Date.now()}`;

let createdPackageName: string | null = null;

When("crio um pacote de moedas de teste", async ({ page }) => {
  createdPackageName = testPackageName();
  await new AdminCoinPackagesPage(page).createPackage({
    name: createdPackageName,
    amountReais: "9.99",
    coinsAmount: "200",
  });
});

When(
  "alterno o status do pacote {string}",
  async ({ page }, packageName: string) => {
    const packagesPage = new AdminCoinPackagesPage(page);
    await packagesPage.togglePackageActive(packageName);
    await packagesPage.togglePackageActive(packageName);
  },
);

Then("devo ver o pacote de moedas de teste", async ({ page }) => {
  if (!createdPackageName) {
    throw new Error("Pacote de teste não foi criado");
  }
  await new AdminCoinPackagesPage(page).expectPackageVisible(
    createdPackageName,
  );
});

Then(
  "o pacote {string} deve estar ativo novamente",
  async ({ page }, packageName: string) => {
    const card = page
      .locator("div.sb-surface.border")
      .filter({ has: page.getByRole("heading", { name: packageName, exact: true }) });
    await card.getByRole("button", { name: "Desativar" }).waitFor({
      state: "visible",
      timeout: 10_000,
    });
  },
);
