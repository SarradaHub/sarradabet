jest.mock("../../config/env", () => ({
  config: {
    MERCADOPAGO_STORE_EXTERNAL_ID: "SARRADABET001",
    MERCADOPAGO_STORE_NAME: "SarradaBet Store",
    MERCADOPAGO_STORE_STREET_NAME: "Rua Exemplo",
    MERCADOPAGO_STORE_STREET_NUMBER: "123",
    MERCADOPAGO_STORE_CITY_NAME: "São Paulo",
    MERCADOPAGO_STORE_STATE_NAME: "São Paulo",
    MERCADOPAGO_STORE_LATITUDE: -23.55052,
    MERCADOPAGO_STORE_LONGITUDE: -46.633308,
    MERCADOPAGO_STORE_REFERENCE: undefined,
    MERCADOPAGO_POS_EXTERNAL_ID: "SARRADABET001POS001",
    MERCADOPAGO_POS_NAME: "SarradaBet POS 01",
    MERCADOPAGO_POS_CATEGORY: undefined,
    MERCADOPAGO_STORE_ID: undefined as number | undefined,
    MERCADOPAGO_POS_ID: undefined as number | undefined,
    MERCADOPAGO_POS_UUID: undefined as string | undefined,
  },
}));

import { config } from "../../config/env";
import {
  getMercadoPagoInstoreRuntimeConfig,
  getMercadoPagoInstoreSetupConfig,
} from "../../modules/payment/instoreConfig";

describe("instoreConfig", () => {
  beforeEach(() => {
    config.MERCADOPAGO_STORE_ID = undefined;
    config.MERCADOPAGO_POS_ID = undefined;
    config.MERCADOPAGO_POS_UUID = undefined;
  });

  it("returns setup config from environment values", () => {
    const setup = getMercadoPagoInstoreSetupConfig();

    expect(setup.storeExternalId).toBe("SARRADABET001");
    expect(setup.storeName).toBe("SarradaBet Store");
    expect(setup.posExternalId).toBe("SARRADABET001POS001");
    expect(setup.storeLocation.latitude).toBe(-23.55052);
  });

  it("returns runtime config when all required IDs are present", () => {
    config.MERCADOPAGO_STORE_ID = 123456789;
    config.MERCADOPAGO_POS_ID = 987654321;
    config.MERCADOPAGO_POS_UUID = "abc-123-def-456";

    const runtime = getMercadoPagoInstoreRuntimeConfig();

    expect(runtime).toEqual({
      storeId: 123456789,
      storeExternalId: "SARRADABET001",
      posId: 987654321,
      posExternalId: "SARRADABET001POS001",
      posUuid: "abc-123-def-456",
    });
  });

  it("throws a validation error when runtime IDs are missing", () => {
    expect(() => getMercadoPagoInstoreRuntimeConfig()).toThrow(
      "Missing Mercado Pago instore runtime environment variables: MERCADOPAGO_STORE_ID, MERCADOPAGO_POS_ID, MERCADOPAGO_POS_UUID. Run npm run mp:setup-store first.",
    );
  });

  it("throws when store id is missing but other ids are present", () => {
    config.MERCADOPAGO_POS_ID = 987654321;
    config.MERCADOPAGO_POS_UUID = "abc-123-def-456";

    expect(() => getMercadoPagoInstoreRuntimeConfig()).toThrow(
      "MERCADOPAGO_STORE_ID",
    );
  });
});
