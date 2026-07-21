import { config } from "../src/config/env";
import { getMercadoPagoInstoreSetupConfig } from "../src/modules/payment/instoreConfig";
import { MercadoPagoInstoreClient, extractPosUuidFromQrImage } from "../src/modules/payment/services/MercadoPagoInstoreClient";
import type {
  MercadoPagoPosResponse,
  MercadoPagoStoreResponse,
} from "../src/modules/payment/types/instore";

function printEnvBlock(
  store: MercadoPagoStoreResponse,
  pos: MercadoPagoPosResponse,
): void {
  const posUuid =
    pos.uuid ?? extractPosUuidFromQrImage(pos.qr?.image);

  console.log("\nAdd these values to apps/api/.env:\n");
  console.log(`MERCADOPAGO_STORE_ID=${store.id}`);
  console.log(`MERCADOPAGO_STORE_EXTERNAL_ID=${store.external_id}`);
  console.log(`MERCADOPAGO_POS_ID=${pos.id}`);
  console.log(`MERCADOPAGO_POS_EXTERNAL_ID=${pos.external_id}`);
  if (posUuid) {
    console.log(`MERCADOPAGO_POS_UUID=${posUuid}`);
  }
  console.log("");
}

function isPlaceholderAccessToken(token: string): boolean {
  const normalized = token.trim().toLowerCase();
  return (
    normalized.includes("your_mercadopago") ||
    normalized === "your_mercadopago_test_access_token" ||
    normalized.endsWith("_here") ||
    normalized.includes("replace_me")
  );
}

async function main(): Promise<void> {
  if (!config.MERCADOPAGO_ACCESS_TOKEN) {
    console.error("MERCADOPAGO_ACCESS_TOKEN is required.");
    console.error("");
    console.error("Create apps/api/.env.local with:");
    console.error("MERCADOPAGO_ACCESS_TOKEN=APP_USR-your-test-token");
    console.error("");
    console.error("Or run once:");
    console.error(
      "MERCADOPAGO_ACCESS_TOKEN=APP_USR-... npm run mp:setup-store",
    );
    process.exit(1);
  }

  if (isPlaceholderAccessToken(config.MERCADOPAGO_ACCESS_TOKEN)) {
    console.error(
      "MERCADOPAGO_ACCESS_TOKEN is still a placeholder in apps/api/.env.",
    );
    console.error("");
    console.error("Mercado Pago > Suas integrações > sarradabet > Credenciais de teste");
    console.error("Copy Access Token de teste into apps/api/.env.local:");
    console.error("");
    console.error("MERCADOPAGO_ACCESS_TOKEN=APP_USR-...");
    console.error("MERCADOPAGO_MOCK_PIX=false");
    console.error("");
    console.error("Then rerun: npm run mp:setup-store");
    process.exit(1);
  }

  const setupConfig = getMercadoPagoInstoreSetupConfig();
  const client = new MercadoPagoInstoreClient();

  console.log(
    `Using store location ${setupConfig.storeLocation.cityName}, ${setupConfig.storeLocation.stateName}. Override MERCADOPAGO_STORE_* in .env before production.`,
  );

  const userId =
    config.MERCADOPAGO_USER_ID ?? (await client.getAuthenticatedUserId());

  console.log(`Using Mercado Pago user_id=${userId}`);

  let store =
    (await client.searchStoreByExternalId(
      userId,
      setupConfig.storeExternalId,
    )) ??
    (await client.createStore(userId, {
      name: setupConfig.storeName,
      external_id: setupConfig.storeExternalId,
      location: {
        street_name: setupConfig.storeLocation.streetName,
        street_number: setupConfig.storeLocation.streetNumber,
        city_name: setupConfig.storeLocation.cityName,
        state_name: setupConfig.storeLocation.stateName,
        latitude: setupConfig.storeLocation.latitude,
        longitude: setupConfig.storeLocation.longitude,
        reference: setupConfig.storeLocation.reference,
      },
    }));

  console.log(
    store.id
      ? `Store ready: id=${store.id}, external_id=${store.external_id}`
      : "Store created",
  );

  const pos =
    (await client.searchPosByExternalId(setupConfig.posExternalId)) ??
    (await client.createPos({
      name: setupConfig.posName,
      fixed_amount: true,
      store_id: store.id,
      external_store_id: store.external_id,
      external_id: setupConfig.posExternalId,
      category: setupConfig.posCategory,
    }));

  const resolvedPos = await client.hydratePosDetails(pos);

  console.log(
    `POS ready: id=${resolvedPos.id}, external_id=${resolvedPos.external_id}, uuid=${resolvedPos.uuid ?? "n/a"}`,
  );

  if (resolvedPos.qr?.image) {
    console.log(`Static QR image: ${resolvedPos.qr.image}`);
  }

  printEnvBlock(store, resolvedPos);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Mercado Pago store/POS setup failed: ${message}`);
  process.exit(1);
});
