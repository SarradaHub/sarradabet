export type PixPaymentStatus =
  | "PENDING"
  | "APPROVED"
  | "EXPIRED"
  | "CANCELLED"
  | "FAILED";

export type PixPaymentChannel = "online" | "instore";

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
  channel?: PixPaymentChannel;
  isMock?: boolean;
  instructionMessage?: string;
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
  channel?: PixPaymentChannel;
  isMock?: boolean;
  instructionMessage?: string;
}

export interface AdminPixPaymentListItem {
  id: number;
  status: PixPaymentStatus;
  amountCents: number;
  coinsAmount: number;
  packageName: string;
  createdAt: string;
  expiresAt: string;
  paidAt: string | null;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

export interface AdminPixPaymentListResponse {
  items: AdminPixPaymentListItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminPixPaymentApproveResponse {
  id: number;
  status: PixPaymentStatus;
  paidAt: string;
  coinsAmount: number;
  newBalance: number;
}
