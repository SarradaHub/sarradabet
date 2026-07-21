export type PixPaymentStatus =
  | "PENDING"
  | "APPROVED"
  | "EXPIRED"
  | "CANCELLED"
  | "FAILED";

export interface CreatePixPurchaseRequest {
  coinPackageId: number;
}

export interface CreatePixPurchaseResponse {
  paymentId: number;
  externalId: string;
  qrCode: string | null;
  qrCodeBase64: string | null;
  copyPaste: string | null;
  ticketUrl: string | null;
  expiresAt: string;
  coinsAmount: number;
  amountCents: number;
  packageName: string;
  status: PixPaymentStatus;
  isMock?: boolean;
}

export interface PixPaymentStatusResponse {
  id: number;
  externalId: string;
  status: PixPaymentStatus;
  coinsAmount: number;
  amountCents: number;
  packageName: string;
  expiresAt: string;
  paidAt: string | null;
  qrCode: string | null;
  qrCodeBase64: string | null;
  copyPaste: string | null;
  isMock?: boolean;
}
