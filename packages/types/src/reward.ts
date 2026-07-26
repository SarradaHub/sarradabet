export interface Reward {
  id: number;
  title: string;
  description: string | null;
  coinCost: number;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RewardRedemption {
  id: number;
  rewardId: number;
  userId: number;
  ticketCode: string;
  redeemedAt: string;
  validatedAt: string | null;
  validatedBy: number | null;
}

export interface CreateRewardDto {
  title: string;
  description?: string;
  coinCost: number;
  stock: number;
  imageUrl?: string;
  isActive?: boolean;
}

export interface UpdateRewardDto {
  title?: string;
  description?: string;
  coinCost?: number;
  stock?: number;
  imageUrl?: string;
  isActive?: boolean;
}

export interface RedeemRewardResponse {
  ticketCode: string;
  reward: Reward;
  newBalance: number;
  ticketImageUrl: string;
}

export interface ValidateTicketResponse {
  valid: boolean;
  message: string;
  redemption?: RewardRedemption;
  rewardTitle?: string;
  username?: string;
  redeemedAt?: string;
  validatedAt?: string;
  validateImageUrl?: string;
}

export interface UserRewardRedemption {
  id: number;
  ticketCode: string;
  redeemedAt: string;
  validatedAt: string | null;
  reward: Pick<Reward, "id" | "title" | "description" | "coinCost" | "imageUrl">;
}
