import type { UserPublic } from "@sarradabet/types";
import type { ApiResponse } from "../core/interfaces/IService";
import { createApiClient } from "./apiClient";

class UserService {
  private readonly api = createApiClient("users");

  async getById(id: number): Promise<UserPublic> {
    const response = await this.api.get<ApiResponse<UserPublic>>(`/${id}`);
    return response.data.data;
  }

  async listUsers(): Promise<UserPublic[]> {
    const response = await this.api.get<ApiResponse<UserPublic[]>>("/");
    return response.data.data;
  }

  async deleteUser(id: number): Promise<void> {
    await this.api.delete(`/${id}`);
  }
}

export const userService = new UserService();
