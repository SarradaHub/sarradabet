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

export interface UpdateUserDto {
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: UserRole;
}

export interface AuthTokensResponse {
  user: UserPublic;
  accessToken: {
    token: string;
    expiresIn: string;
  };
}
