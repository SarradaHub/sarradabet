describe("env boolean parsing", () => {
  const originalMockPix = process.env.MERCADOPAGO_MOCK_PIX;

  afterEach(() => {
    jest.resetModules();
    if (originalMockPix === undefined) {
      delete process.env.MERCADOPAGO_MOCK_PIX;
    } else {
      process.env.MERCADOPAGO_MOCK_PIX = originalMockPix;
    }
  });

  it("parses MERCADOPAGO_MOCK_PIX=false as false", async () => {
    process.env.MERCADOPAGO_MOCK_PIX = "false";
    const { config } = await import("../../config/env");
    expect(config.MERCADOPAGO_MOCK_PIX).toBe(false);
  });

  it("parses MERCADOPAGO_MOCK_PIX=true as true", async () => {
    process.env.MERCADOPAGO_MOCK_PIX = "true";
    const { config } = await import("../../config/env");
    expect(config.MERCADOPAGO_MOCK_PIX).toBe(true);
  });
});
