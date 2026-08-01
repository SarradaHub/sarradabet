import type { TicketVerifyResponse } from "@sarradabet/types";
import axios from "axios";
import { getApiRootUrl } from "./apiClient";

class TicketService {
  async verify(ticketCode: string): Promise<TicketVerifyResponse> {
    const response = await axios.get<{
      success: boolean;
      data: TicketVerifyResponse;
    }>(`${getApiRootUrl()}/api/v1/tickets/verify/${ticketCode}`, {
      timeout: 10000,
    });

    return response.data.data;
  }
}

export const ticketService = new TicketService();

export function getTicketImagePath(ticketCode: string): string {
  return `/api/v1/rewards/tickets/${ticketCode}/image`;
}

export function getValidateImagePath(ticketCode: string): string {
  return `/api/v1/admin/rewards/tickets/${ticketCode}/validate-image`;
}

export function getUserValidateImagePath(ticketCode: string): string {
  return `/api/v1/rewards/tickets/${ticketCode}/validate-image`;
}
