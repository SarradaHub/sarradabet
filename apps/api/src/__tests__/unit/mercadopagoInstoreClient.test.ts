import axios from "axios";
import { MercadoPagoConfig, User } from "mercadopago";
import { MercadoPagoInstoreClient, extractPosUuidFromQrImage } from "../../modules/payment/services/MercadoPagoInstoreClient";

jest.mock("axios", () => {
  const mockCreate = jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
  }));

  return {
    __esModule: true,
    default: {
      create: mockCreate,
      isAxiosError: jest.fn(),
    },
    isAxiosError: jest.fn(),
  };
});

jest.mock("mercadopago", () => ({
  MercadoPagoConfig: jest.fn(),
  User: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
  })),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("MercadoPagoInstoreClient", () => {
  const accessToken = "APP_USR-test-token";
  let client: MercadoPagoInstoreClient;
  let httpGet: jest.Mock;
  let httpPost: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    httpGet = jest.fn();
    httpPost = jest.fn();

    mockedAxios.create.mockReturnValue({
      get: httpGet,
      post: httpPost,
    } as never);

    mockedAxios.isAxiosError.mockReturnValue(false);

    client = new MercadoPagoInstoreClient(accessToken);
  });

  it("returns authenticated user id from User.get()", async () => {
    const getMock = jest.fn().mockResolvedValue({ id: 123456 });
    (User as jest.Mock).mockImplementation(() => ({ get: getMock }));

    await expect(client.getAuthenticatedUserId()).resolves.toBe(123456);
    expect(MercadoPagoConfig).toHaveBeenCalledWith({ accessToken });
    expect(getMock).toHaveBeenCalled();
  });

  it("creates a store via POST /users/{userId}/stores", async () => {
    httpPost.mockResolvedValue({
      data: {
        id: 999,
        name: "Loja Instore",
        external_id: "LOJ001",
      },
    });

    const result = await client.createStore(123456, {
      name: "Loja Instore",
      external_id: "LOJ001",
      location: {
        street_number: "123",
        street_name: "Rua Exemplo",
        city_name: "Sao Paulo",
        state_name: "Sao Paulo",
        latitude: -23.55,
        longitude: -46.63,
      },
    });

    expect(httpPost).toHaveBeenCalledWith("/users/123456/stores", {
      name: "Loja Instore",
      external_id: "LOJ001",
      location: expect.objectContaining({ city_name: "Sao Paulo" }),
    });
    expect(result.id).toBe(999);
  });

  it("returns existing store from search by external id", async () => {
    httpGet.mockResolvedValue({
      data: {
        results: [
          {
            id: "888",
            name: "Existing Store",
            external_id: "LOJ001",
          },
        ],
      },
    });

    const result = await client.searchStoreByExternalId(123456, "LOJ001");

    expect(httpGet).toHaveBeenCalledWith("/users/123456/stores/search", {
      params: { external_id: "LOJ001" },
    });
    expect(result?.id).toBe(888);
  });

  it("returns null when store search responds with 404", async () => {
    mockedAxios.isAxiosError.mockReturnValue(true);
    httpGet.mockRejectedValue({ response: { status: 404 } });

    await expect(
      client.searchStoreByExternalId(123456, "MISSING"),
    ).resolves.toBeNull();
  });

  it("creates a POS via POST /pos", async () => {
    httpPost.mockResolvedValue({
      data: {
        id: 2711382,
        name: "First POS",
        fixed_amount: true,
        store_id: 999,
        external_store_id: "LOJ001",
        external_id: "LOJ001POS001",
        uuid: "0977011a027c4b4387e52069da4264deae2946af4dcc44ee98a8f1dbb376c8a1",
      },
    });

    const result = await client.createPos({
      name: "First POS",
      fixed_amount: true,
      store_id: 999,
      external_store_id: "LOJ001",
      external_id: "LOJ001POS001",
    });

    expect(httpPost).toHaveBeenCalledWith("/pos", {
      name: "First POS",
      fixed_amount: true,
      store_id: 999,
      external_store_id: "LOJ001",
      external_id: "LOJ001POS001",
    });
    expect(result.uuid).toBe(
      "0977011a027c4b4387e52069da4264deae2946af4dcc44ee98a8f1dbb376c8a1",
    );
  });

  it("returns existing POS from search by external id", async () => {
    httpGet
      .mockResolvedValueOnce({
        data: {
          results: [
            {
              id: 555,
              external_id: "LOJ001POS001",
              name: "Existing POS",
              fixed_amount: true,
              store_id: 999,
              external_store_id: "LOJ001",
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: 555,
          external_id: "LOJ001POS001",
          name: "Existing POS",
          fixed_amount: true,
          store_id: 999,
          external_store_id: "LOJ001",
          uuid: "abc123",
          qr: {
            image:
              "https://www.mercadopago.com/instore/merchant/qr/555/abc123.png",
          },
        },
      });

    const result = await client.searchPosByExternalId("LOJ001POS001");

    expect(httpGet).toHaveBeenNthCalledWith(1, "/pos", {
      params: { external_id: "LOJ001POS001" },
    });
    expect(httpGet).toHaveBeenNthCalledWith(2, "/pos/555");
    expect(result?.id).toBe(555);
    expect(result?.uuid).toBe("abc123");
  });

  it("extracts POS uuid from static QR image URL", () => {
    expect(
      extractPosUuidFromQrImage(
        "https://www.mercadopago.com/instore/merchant/qr/135594016/101e0515808d40dcbb43079337b603c4a4e96f5c954d44d389855f745ae9d59a.png",
      ),
    ).toBe(
      "101e0515808d40dcbb43079337b603c4a4e96f5c954d44d389855f745ae9d59a",
    );
  });

  it("maps Mercado Pago API errors to ExternalServiceError", async () => {
    mockedAxios.isAxiosError.mockReturnValue(true);
    httpPost.mockRejectedValue({
      message: "Request failed",
      response: {
        status: 400,
        data: {
          message: "Invalid store location",
          cause: [{ description: "latitude is required", code: 101 }],
        },
      },
    });

    await expect(
      client.createStore(123456, {
        name: "Bad Store",
        external_id: "BAD001",
        location: {
          street_number: "1",
          street_name: "Rua",
          city_name: "City",
          state_name: "State",
          latitude: 0,
          longitude: 0,
        },
      }),
    ).rejects.toMatchObject({
      name: "ExternalServiceError",
      message: expect.stringContaining("create store failed: latitude is required"),
    });
  });
});
