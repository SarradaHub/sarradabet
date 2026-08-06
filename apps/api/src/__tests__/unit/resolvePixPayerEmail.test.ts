jest.mock("../../config/env", () => ({
  config: {
    MERCADOPAGO_TEST_PAYER_EMAIL: undefined as string | undefined,
  },
}));

import { config } from "../../config/env";
import { resolvePixPayerEmail } from "../../modules/payment/resolvePixPayerEmail";

describe("resolvePixPayerEmail", () => {
  afterEach(() => {
    config.MERCADOPAGO_TEST_PAYER_EMAIL = undefined;
  });

  it("uses the app user email by default", () => {
    expect(resolvePixPayerEmail("user@sarradabet.com")).toBe(
      "user@sarradabet.com",
    );
  });

  it("uses MERCADOPAGO_TEST_PAYER_EMAIL when explicitly set", () => {
    config.MERCADOPAGO_TEST_PAYER_EMAIL = "custom@testuser.com";
    expect(resolvePixPayerEmail("user@sarradabet.com")).toBe(
      "custom@testuser.com",
    );
  });
});
