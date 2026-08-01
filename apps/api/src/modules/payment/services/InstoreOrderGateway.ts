export interface CreateInstoreOrderInput {
  amountCents: number;
  description: string;
  externalReference: string;
  idempotencyKey: string;
  posExternalId: string;
}

export interface InstoreOrderGatewayResult {
  id: string;
  status: string;
  qrCode: string | null;
  qrCodeBase64: string | null;
}

export interface InstoreOrderGateway {
  createOrder(
    input: CreateInstoreOrderInput,
  ): Promise<InstoreOrderGatewayResult>;
  getOrder(orderId: string): Promise<InstoreOrderGatewayResult>;
  approveMockOrder?(orderId: string): void;
}

export function isMockInstoreOrderId(orderId: string): boolean {
  return orderId.startsWith("instore_mock_");
}

export function isInstoreOrderId(orderId: string): boolean {
  return orderId.startsWith("instore_");
}
