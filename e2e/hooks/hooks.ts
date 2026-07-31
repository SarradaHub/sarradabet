import { Before, After } from "../fixtures/fixtures";
import { clearTestUser, getTestUser } from "../fixtures/test-user-state";
import {
  clearClosedBet,
  clearTestBet,
  clearTestCategory,
  getClosedBet,
  getTestBet,
  getTestCategory,
} from "../fixtures/test-data-state";
import {
  deleteBetViaApi,
  deleteCategoryViaApi,
  deleteUserViaApi,
  loginViaApi,
} from "../fixtures/seed";

Before({ tags: "@pix" }, async () => {
  if (process.env.MERCADOPAGO_MOCK_PIX !== "true" && !process.env.CI) {
    process.env.MERCADOPAGO_MOCK_PIX = "true";
  }
});

After({ tags: "@creates-user" }, async () => {
  const user = getTestUser();
  if (!user) {
    return;
  }

  try {
    const adminToken = await loginViaApi("admin");
    await deleteUserViaApi(adminToken, user.id);
  } catch {
    // User may already have been deleted by the scenario under test.
  } finally {
    clearTestUser();
  }
});

After({ tags: "@creates-category" }, async () => {
  const category = getTestCategory();
  if (!category) {
    return;
  }

  try {
    const adminToken = await loginViaApi("admin");
    await deleteCategoryViaApi(adminToken, category.id);
  } catch {
    // Category may already have been deleted by the scenario under test.
  } finally {
    clearTestCategory();
  }
});

After({ tags: "@creates-bet" }, async () => {
  const bet = getTestBet();
  if (!bet || bet.id === 0) {
    clearTestBet();
    return;
  }

  try {
    const adminToken = await loginViaApi("admin");
    await deleteBetViaApi(adminToken, bet.id);
  } catch {
    // Bet may already have been deleted by the scenario under test.
  } finally {
    clearTestBet();
  }
});

After({ tags: "@creates-closed-bet" }, async () => {
  const bet = getClosedBet();
  if (!bet) {
    return;
  }

  try {
    const adminToken = await loginViaApi("admin");
    await deleteBetViaApi(adminToken, bet.id);
  } catch {
    // Bet cleanup is best-effort.
  } finally {
    clearClosedBet();
  }
});
