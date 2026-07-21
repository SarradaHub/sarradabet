export type UserRole = "USER" | "ADMIN";

export interface UserPublic {
  id: number;
  username: string;
  email: string;
  phone: string;
  role: UserRole;
  coinBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokensResponse {
  user: UserPublic;
  accessToken: {
    token: string;
    expiresIn: string;
  };
}
