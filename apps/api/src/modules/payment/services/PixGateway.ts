export interface CreatePixPaymentInput {
  amountCents: number;
  description: string;
  externalReference: string;
  idempotencyKey: string;
  expirationDate: Date;
  payerEmail: string;
}

export interface PixGatewayPaymentResult {
  id: string;
  status: string;
  qrCode: string | null;
  qrCodeBase64: string | null;
  ticketUrl: string | null;
}

export interface PixGateway {
  createPixPayment(input: CreatePixPaymentInput): Promise<PixGatewayPaymentResult>;
  getPayment(paymentId: string): Promise<PixGatewayPaymentResult>;
  approveMockPayment?(paymentId: string): void;
}
