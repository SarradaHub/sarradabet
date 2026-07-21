import { randomUUID } from "crypto";
import QRCode from "qrcode";
import type {
  CreatePixPaymentInput,
  PixGateway,
  PixGatewayPaymentResult,
} from "./PixGateway";

interface MockPaymentRecord {
  status: string;
  qrCode: string;
}

export class MockMercadoPagoClient implements PixGateway {
  private readonly payments = new Map<string, MockPaymentRecord>();

  async createPixPayment(
    input: CreatePixPaymentInput,
  ): Promise<PixGatewayPaymentResult> {
    const id = `mock_${randomUUID()}`;
    const qrCode = `00020126580014BR.GOV.BCB.PIX0136${id}520400005303986540${(input.amountCents / 100).toFixed(2)}5802BR5925SarradaBet Dev Mock6009SAO PAULO62070503***6304MOCK`;
    const qrCodeBase64 = (
      await QRCode.toBuffer(qrCode, {
        type: "png",
        width: 256,
        margin: 1,
      })
    ).toString("base64");

    this.payments.set(id, { status: "pending", qrCode });

    return {
      id,
      status: "pending",
      qrCode,
      qrCodeBase64,
      ticketUrl: null,
    };
  }

  async getPayment(paymentId: string): Promise<PixGatewayPaymentResult> {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      throw new Error(`Mock payment ${paymentId} not found`);
    }

    const qrCodeBase64 = (
      await QRCode.toBuffer(payment.qrCode, {
        type: "png",
        width: 256,
        margin: 1,
      })
    ).toString("base64");

    return {
      id: paymentId,
      status: payment.status,
      qrCode: payment.qrCode,
      qrCodeBase64,
      ticketUrl: null,
    };
  }

  approveMockPayment(paymentId: string): void {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      throw new Error(`Mock payment ${paymentId} not found`);
    }

    payment.status = "approved";
  }
}

export function isMockPixPaymentId(paymentId: string): boolean {
  return paymentId.startsWith("mock_");
}
