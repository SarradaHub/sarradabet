import axios from "axios";
import { config } from "../src/config/env";
import { upsertEnvFile } from "./upsertEnvFile";

const WEBHOOK_PATH = "/api/v1/webhooks/mercadopago";
const DEFAULT_NGROK_API = "http://127.0.0.1:4040/api/tunnels";
const ENV_LOCAL_PATH = ".env.local";

interface NgrokTunnelResponse {
  tunnels?: Array<{
    public_url?: string;
    proto?: string;
  }>;
}

function parseArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match?.slice(prefix.length);
}

function normalizePublicUrl(url: string): string {
  return url.replace(/\/$/, "");
}

function buildWebhookUrl(publicBaseUrl: string): string {
  return `${normalizePublicUrl(publicBaseUrl)}${WEBHOOK_PATH}`;
}

async function discoverNgrokPublicUrl(): Promise<string | null> {
  const ngrokApiUrl = process.env.NGROK_API_URL ?? DEFAULT_NGROK_API;

  try {
    const response = await axios.get<NgrokTunnelResponse>(ngrokApiUrl, {
      timeout: 2000,
    });

    const httpsTunnel = response.data.tunnels?.find(
      (tunnel) => tunnel.proto === "https" && tunnel.public_url,
    );
    const fallbackTunnel = response.data.tunnels?.find(
      (tunnel) => tunnel.public_url,
    );

    const publicUrl = httpsTunnel?.public_url ?? fallbackTunnel?.public_url;
    return publicUrl ? normalizePublicUrl(publicUrl) : null;
  } catch {
    return null;
  }
}

async function syncMercadoPagoWebhook(webhookUrl: string): Promise<void> {
  if (!config.MERCADOPAGO_ACCESS_TOKEN) {
    console.warn(
      "Skipping Mercado Pago panel sync: MERCADOPAGO_ACCESS_TOKEN is not configured.",
    );
    return;
  }

  const applicationId =
    process.env.MERCADOPAGO_APPLICATION_ID ?? "7716487240713931";

  try {
    await axios.put(
      `https://api.mercadopago.com/applications/${applicationId}/notifications`,
      {
        callback_url: webhookUrl,
        callback_url_test: webhookUrl,
        events: [{ topic: "payment" }, { topic: "order" }],
      },
      {
        headers: {
          Authorization: `Bearer ${config.MERCADOPAGO_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("Mercado Pago webhook URLs updated in developer panel.");
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.warn(
        "Could not auto-sync Mercado Pago panel webhook. Update it manually in Suas integrações > Webhooks.",
      );
      console.warn(
        `Suggested test URL: ${webhookUrl}`,
      );
      if (error.response?.data) {
        console.warn(JSON.stringify(error.response.data));
      }
      return;
    }

    throw error;
  }
}

async function main(): Promise<void> {
  const explicitUrl = parseArg("url");
  const skipSync = process.argv.includes("--no-sync");
  const publicBaseUrl =
    explicitUrl ??
    (await discoverNgrokPublicUrl()) ??
    process.env.NGROK_PUBLIC_URL;

  if (!publicBaseUrl) {
    console.error("Could not determine ngrok public URL.");
    console.error("");
    console.error("1. Install ngrok: https://ngrok.com/download");
    console.error("2. Authenticate: ngrok config add-authtoken <token>");
    console.error("3. Start tunnel: ngrok http 8000");
    console.error("4. Run again: npm run webhook:configure");
    console.error("");
    console.error("Or pass the URL explicitly:");
    console.error(
      "npm run webhook:configure -- --url=https://your-subdomain.ngrok-free.app",
    );
    process.exit(1);
  }

  const webhookUrl = buildWebhookUrl(publicBaseUrl);

  upsertEnvFile(ENV_LOCAL_PATH, {
    MERCADOPAGO_NOTIFICATION_URL: webhookUrl,
    MERCADOPAGO_MOCK_PIX: "false",
  });

  console.log(`Updated ${ENV_LOCAL_PATH}:`);
  console.log(`  MERCADOPAGO_NOTIFICATION_URL=${webhookUrl}`);
  console.log("  MERCADOPAGO_MOCK_PIX=false");
  console.log("");
  console.log("Restart the API so it loads .env.local, then create a new Pix payment.");

  if (!skipSync) {
    await syncMercadoPagoWebhook(webhookUrl);
  }

  console.log("");
  console.log("Quick test:");
  console.log(`  curl -i ${webhookUrl}`);
  console.log("Expect HTTP 404/405 on GET — webhook only accepts POST from Mercado Pago.");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Webhook tunnel configure failed: ${message}`);
  process.exit(1);
});
