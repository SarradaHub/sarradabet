import { Then } from "../fixtures/fixtures";
import { AdminDashboardPage } from "../pages/admin-dashboard.page";

Then("devo ver os cards de estatísticas do dashboard", async ({ page }) => {
  await new AdminDashboardPage(page).expectLoaded();
});

Then("devo ver as ações rápidas do dashboard", async ({ page }) => {
  await new AdminDashboardPage(page).expectQuickActionsVisible();
});
