jest.mock("dotenv", () => ({
  config: jest.fn(),
}));

describe("Mercado Pago access token resolution", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  it("prefers MERCADOPAGO_PAYMENTS_ACCESS_TOKEN for online Pix", async () => {
    process.env.MERCADOPAGO_PAYMENTS_ACCESS_TOKEN = "TEST-payments";
    process.env.MERCADOPAGO_INSTORE_ACCESS_TOKEN = "APP_USR-instore";
    process.env.MERCADOPAGO_ACCESS_TOKEN = "APP_USR-fallback";

    const { config } = await import("../../config/env");

    expect(config.mercadoPagoPaymentsAccessToken).toBe("TEST-payments");
    expect(config.mercadoPagoInstoreAccessToken).toBe("APP_USR-instore");
  });

  it("falls back to MERCADOPAGO_ACCESS_TOKEN when specific tokens are unset", async () => {
    delete process.env.MERCADOPAGO_PAYMENTS_ACCESS_TOKEN;
    delete process.env.MERCADOPAGO_INSTORE_ACCESS_TOKEN;
    process.env.MERCADOPAGO_ACCESS_TOKEN = "APP_USR-shared";

    const { config } = await import("../../config/env");

    expect(config.mercadoPagoPaymentsAccessToken).toBe("APP_USR-shared");
    expect(config.mercadoPagoInstoreAccessToken).toBe("APP_USR-shared");
  });
});
