export type CoinTransactionType = "CREDIT" | "DEBIT";

export type CoinTransactionSource =
  | "PIX_PURCHASE"
  | "BET_COST"
  | "ADMIN_ADJUSTMENT"
  | "REFUND";

export interface CoinBalance {
  balance: number;
}

export interface CoinTransaction {
  id: number;
  userId: number;
  type: CoinTransactionType;
  amount: number;
  balanceAfter: number;
  source: CoinTransactionSource;
  referenceId: number | null;
  externalId: string | null;
  description: string | null;
  createdAt: string;
}

export interface CoinPackage {
  id: number;
  name: string;
  amountCents: number;
  coinsAmount: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCoinPackageDto {
  name: string;
  amountCents: number;
  coinsAmount: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateCoinPackageDto {
  name?: string;
  amountCents?: number;
  coinsAmount?: number;
  isActive?: boolean;
  sortOrder?: number;
}
