import { config } from "../src/config/env";
import { getMercadoPagoInstoreRuntimeConfig } from "../src/modules/payment/instoreConfig";
import { MercadoPagoInstoreClient } from "../src/modules/payment/services/MercadoPagoInstoreClient";

function check(label: string, ok: boolean, detail?: string) {
  const status = ok ? "OK" : "MISSING";
  console.log(`${ok ? "✅" : "❌"} ${label}: ${status}${detail ? ` (${detail})` : ""}`);
  return ok;
}

async function main() {
  console.log("Mercado Pago live setup validation\n");

  const checks = [
    check(
      "Payments access token (TEST-)",
      Boolean(config.mercadoPagoPaymentsAccessToken),
      config.mercadoPagoPaymentsAccessToken?.startsWith("TEST-")
        ? "TEST-"
        : "non-TEST prefix",
    ),
    check(
      "Instore access token (APP_USR-)",
      Boolean(config.mercadoPagoInstoreAccessToken),
      config.mercadoPagoInstoreAccessToken?.startsWith("APP_USR-")
        ? "APP_USR-"
        : "other",
    ),
    check("MERCADOPAGO_WEBHOOK_SECRET", Boolean(config.MERCADOPAGO_WEBHOOK_SECRET)),
    check(
      "MERCADOPAGO_NOTIFICATION_URL (HTTPS)",
      Boolean(config.MERCADOPAGO_NOTIFICATION_URL?.startsWith("https://")),
      config.MERCADOPAGO_NOTIFICATION_URL?.replace(/\/\/.*@/, "//***@"),
    ),
    check("MERCADOPAGO_MOCK_PIX disabled", !config.MERCADOPAGO_MOCK_PIX),
  ];

  let runtimeOk = false;
  try {
    const runtime = getMercadoPagoInstoreRuntimeConfig();
    runtimeOk = check("Instore runtime IDs", true, `store=${runtime.storeId}, pos=${runtime.posId}`);
  } catch (error) {
    check(
      "Instore runtime IDs",
      false,
      error instanceof Error ? error.message : "invalid",
    );
  }

  if (!checks.every(Boolean) || !runtimeOk) {
    console.error("\nFix missing configuration before live Pix testing.");
    process.exit(1);
  }

  if (process.argv.includes("--ping")) {
    const client = new MercadoPagoInstoreClient(
      config.mercadoPagoInstoreAccessToken!,
    );
    const userId = await client.getAuthenticatedUserId(config.MERCADOPAGO_USER_ID);
    check("MP API auth (/users/me)", true, `user_id=${userId}`);
  }

  console.log("\nLive test checklist:");
  console.log("1. Start API + web (`npm run dev`)");
  console.log("2. For local webhooks: `npm run webhook:tunnel` + `npm run webhook:configure`, restart API");
  console.log("3. Online Pix: /coins → Pix online → pay with MP test buyer");
  console.log("4. Instore QR: /coins or /admin/payments → QR presencial → pay");
  console.log("5. Confirm coins credited and webhook logged");
  console.log("\nRun with --ping to verify Mercado Pago API credentials.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
