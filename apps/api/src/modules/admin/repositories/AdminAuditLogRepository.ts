import { AdminAuditLog, Prisma } from "@prisma/client";

export interface CreateAdminAuditLogData {
  adminId: number;
  action: string;
  targetUserId: number;
  payload: Prisma.InputJsonValue;
}

export class AdminAuditLogRepository {
  async create(
    tx: Prisma.TransactionClient,
    data: CreateAdminAuditLogData,
  ): Promise<AdminAuditLog> {
    return tx.adminAuditLog.create({ data });
  }
}
