import axios from "axios";
import { config } from "../../config/env";

export class EventGatewayClient {
  private readonly endpoint?: string;
  private readonly apiKey?: string;

  constructor(endpoint = config.EVENT_GATEWAY_URL, apiKey = config.EVENT_GATEWAY_API_KEY) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
  }

  async publish(subject: string, payload: unknown): Promise<void> {
    if (!this.endpoint) {
      return; // noop when gateway is disabled
    }

    await axios.post(
      `${this.endpoint.replace(/\/$/, "")}/events/${subject}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          ...(this.apiKey ? { "X-API-Key": this.apiKey } : {}),
        },
        timeout: 3000,
      },
    );
  }
}
