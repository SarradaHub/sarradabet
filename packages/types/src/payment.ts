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
}

export interface AdminCreateInstorePaymentRequest {
  userId: number;
  coinPackageId: number;
}

export interface AdminPixPaymentListQuery {
  page?: number;
  limit?: number;
  status?: PixPaymentStatus;
  channel?: PixPaymentChannel;
  userId?: number;
  startDate?: string;
  endDate?: string;
}

export interface AdminPixPaymentListItem {
  id: number;
  userId: number;
  username: string;
  email: string;
  amountCents: number;
  coinsAmount: number;
  status: PixPaymentStatus;
  channel: PixPaymentChannel;
  packageName: string;
  expiresAt: string;
  paidAt: string | null;
  createdAt: string;
  isMock: boolean;
}

export interface AdminPixPaymentListResponse {
  items: AdminPixPaymentListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminPixPaymentDetail extends AdminPixPaymentListItem {
  externalId: string;
  qrCode: string | null;
  qrCodeBase64: string | null;
  copyPaste: string | null;
  ticketUrl: string | null;
}
