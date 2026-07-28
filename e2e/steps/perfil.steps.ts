import { Then } from "../fixtures/fixtures";
import { ProfilePage } from "../pages/profile.page";

Then(
  "devo ver meu perfil com o usuário {string}",
  async ({ page }, username: string) => {
    await new ProfilePage(page).expectLoadedForUsername(username);
  },
);
