import { expect } from "@playwright/test";
import { Given, When, Then } from "../fixtures/fixtures";
import { AdminCategoriesPage } from "../pages/admin-categories.page";
import {
  categoryExistsViaSearch,
  createCategoryViaApi,
  deleteCategoryViaApi,
  loginViaApi,
  updateCategoryViaApi,
} from "../fixtures/seed";
import {
  getTestCategory,
  setTestCategory,
} from "../fixtures/test-data-state";

Given("existe uma categoria de teste criada via API", async () => {
  const adminToken = await loginViaApi("admin");
  const suffix = Date.now();
  setTestCategory(
    await createCategoryViaApi(adminToken, `E2ECat${suffix}`),
  );
});

When("crio uma categoria de teste", async ({ page }) => {
  const title = `E2ECat${Date.now()}`;
  await new AdminCategoriesPage(page).createCategory(title);
  setTestCategory({ id: 0, title });
});

When("crio a categoria {string}", async ({ page }, title: string) => {
  await new AdminCategoriesPage(page).createCategory(title);
});

When(
  "edito a categoria de teste para {string}",
  async ({}, newTitle: string) => {
    const category = getTestCategory();
    if (!category) {
      throw new Error("Categoria de teste não foi criada");
    }
    const uniqueTitle = `${newTitle}${Date.now()}`;
    const adminToken = await loginViaApi("admin");
    await updateCategoryViaApi(adminToken, category.id, uniqueTitle);
    setTestCategory({ ...category, title: uniqueTitle });
  },
);

When("excluo a categoria de teste via API", async ({}) => {
  const category = getTestCategory();
  if (!category) {
    throw new Error("Categoria de teste não foi criada");
  }
  const adminToken = await loginViaApi("admin");
  await deleteCategoryViaApi(adminToken, category.id);
});

When(
  "tento excluir a categoria {string}",
  async ({ page }, title: string) => {
    const adminCategories = new AdminCategoriesPage(page);
    await page.getByRole("button", { name: `Excluir ${title}` }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Excluir" })
      .click();
  },
);

Then("devo ver a categoria de teste", async ({ page }) => {
  const category = getTestCategory();
  if (!category) {
    throw new Error("Categoria de teste não foi criada");
  }
  await new AdminCategoriesPage(page).expectCategoryVisible(category.title);
});

Then("devo ver a categoria {string}", async ({ page }, title: string) => {
  const category = getTestCategory();
  const expectedTitle =
    category && category.title.startsWith(title) ? category.title : title;
  await new AdminCategoriesPage(page).expectCategoryVisible(expectedTitle);
});

Then("a categoria de teste deve existir na API", async ({}) => {
  const category = getTestCategory();
  if (!category) {
    throw new Error("Categoria de teste não foi criada");
  }
  expect(await categoryExistsViaSearch(category.title)).toBe(true);
});

Then("a categoria de teste não deve existir na API", async ({}) => {
  const category = getTestCategory();
  if (!category) {
    throw new Error("Categoria de teste não foi criada");
  }
  expect(await categoryExistsViaSearch(category.title)).toBe(false);
});

Then("a categoria de teste não deve aparecer", async ({ page }) => {
  const category = getTestCategory();
  if (!category) {
    throw new Error("Categoria de teste não foi criada");
  }
  await expect(
    page.locator("tbody").getByText(category.title),
  ).not.toBeVisible({ timeout: 10_000 });
});

Then(
  "devo ver erro ao excluir categoria com apostas",
  async ({ page }) => {
    await new AdminCategoriesPage(page).expectDeleteError();
  },
);
