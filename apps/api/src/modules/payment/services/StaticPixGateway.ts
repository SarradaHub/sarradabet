import { randomUUID } from "crypto";
import type {
  CreatePixPaymentInput,
  PixGateway,
  PixGatewayPaymentResult,
} from "./PixGateway";
import { config } from "../../../config/env";

export function isStaticPixPaymentId(paymentId: string): boolean {
  return paymentId.startsWith("static_");
}

export class StaticPixGateway implements PixGateway {
  async createPixPayment(
    _input: CreatePixPaymentInput,
  ): Promise<PixGatewayPaymentResult> {
    const id = `static_${randomUUID()}`;

    return {
      id,
      status: "pending",
      qrCode: config.STATIC_PIX_KEY,
      qrCodeBase64: null,
      ticketUrl: null,
    };
  }

  async getPayment(paymentId: string): Promise<PixGatewayPaymentResult> {
    return {
      id: paymentId,
      status: "pending",
      qrCode: config.STATIC_PIX_KEY,
      qrCodeBase64: null,
      ticketUrl: null,
    };
  }
}
