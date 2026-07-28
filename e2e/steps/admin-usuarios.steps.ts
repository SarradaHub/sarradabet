import { Given, When, Then } from "../fixtures/fixtures";
import { AdminUsersPage } from "../pages/admin-users.page";
import { createUserViaApi } from "../fixtures/seed";
import { getTestUser, setTestUser } from "../fixtures/test-user-state";

Given("existe um usuário de teste criado via API", async () => {
  const suffix = Date.now();
  setTestUser(
    await createUserViaApi({
      username: `e2euser${suffix}`,
      email: `e2e${suffix}@test.com`,
    }),
  );
});

When("excluo o usuário de teste", async ({ page }) => {
  const testUser = getTestUser();
  if (!testUser) {
    throw new Error("Usuário de teste não foi criado");
  }
  await new AdminUsersPage(page).deleteUser(testUser.username);
});

Then(
  "devo ver o usuário {string} na listagem",
  async ({ page }, username: string) => {
    await new AdminUsersPage(page).expectUserVisible(username);
  },
);

Then("o usuário de teste não deve aparecer na listagem", async ({ page }) => {
  const testUser = getTestUser();
  if (!testUser) {
    throw new Error("Usuário de teste não foi criado");
  }
  await new AdminUsersPage(page).expectUserNotVisible(testUser.username);
});

Then(
  "o botão {string} do usuário {string} deve estar desabilitado",
  async ({ page }, _buttonLabel: string, username: string) => {
    await new AdminUsersPage(page).expectDeleteDisabled(username);
  },
);
