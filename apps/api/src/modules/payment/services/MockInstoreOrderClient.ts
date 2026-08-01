import { randomUUID } from "crypto";
import QRCode from "qrcode";
import type {
  CreateInstoreOrderInput,
  InstoreOrderGateway,
  InstoreOrderGatewayResult,
} from "./InstoreOrderGateway";

interface MockInstoreOrderRecord {
  status: string;
  qrCode: string;
}

export class MockInstoreOrderClient implements InstoreOrderGateway {
  private readonly orders = new Map<string, MockInstoreOrderRecord>();

  async createOrder(
    input: CreateInstoreOrderInput,
  ): Promise<InstoreOrderGatewayResult> {
    const id = `instore_mock_${randomUUID()}`;
    const qrCode = `00020126580014BR.GOV.BCB.PIX0136${id}520400005303986540${(input.amountCents / 100).toFixed(2)}5802BR5925SarradaBet Instore6009SAO PAULO62070503***6304INST`;
    const qrCodeBase64 = (
      await QRCode.toBuffer(qrCode, {
        type: "png",
        width: 256,
        margin: 1,
      })
    ).toString("base64");

    this.orders.set(id, { status: "created", qrCode });

    return {
      id,
      status: "created",
      qrCode,
      qrCodeBase64,
    };
  }

  async getOrder(orderId: string): Promise<InstoreOrderGatewayResult> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Mock instore order ${orderId} not found`);
    }

    const qrCodeBase64 = (
      await QRCode.toBuffer(order.qrCode, {
        type: "png",
        width: 256,
        margin: 1,
      })
    ).toString("base64");

    return {
      id: orderId,
      status: order.status,
      qrCode: order.qrCode,
      qrCodeBase64,
    };
  }

  approveMockOrder(orderId: string): void {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Mock instore order ${orderId} not found`);
    }

    order.status = "processed";
  }
}
