import { UserRole } from "@prisma/client";
import { prisma } from "../../../config/db";
import { hashPassword } from "../../../utils/auth";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../../core/errors/AppError";

export interface UpdateUserInput {
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: UserRole;
}

const userSelect = {
  id: true,
  username: true,
  email: true,
  phone: true,
  role: true,
  coinBalance: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class UserService {
  async findAll() {
    return prisma.user.findMany({
      select: userSelect,
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findById(id: number) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!user) {
      throw new NotFoundError("User", id);
    }

    return user;
  }

  async update(id: number, data: UpdateUserInput) {
    await this.findById(id);

    if (data.username || data.email || data.phone) {
      const existingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                ...(data.username ? [{ username: data.username }] : []),
                ...(data.email ? [{ email: data.email }] : []),
                ...(data.phone ? [{ phone: data.phone }] : []),
              ],
            },
          ],
        },
      });

      if (existingUser) {
        if (data.username && existingUser.username === data.username) {
          throw new ValidationError("Username already exists");
        }
        if (data.email && existingUser.email === data.email) {
          throw new ValidationError("Email already exists");
        }
        if (data.phone && existingUser.phone === data.phone) {
          throw new ValidationError("Phone already exists");
        }
      }
    }

    const updateData: {
      username?: string;
      email?: string;
      phone?: string;
      passwordHash?: string;
      role?: UserRole;
    } = {};

    if (data.username) {
      updateData.username = data.username;
    }
    if (data.email) {
      updateData.email = data.email;
    }
    if (data.phone) {
      updateData.phone = data.phone;
    }
    if (data.password) {
      updateData.passwordHash = await hashPassword(data.password);
    }
    if (data.role) {
      updateData.role = data.role;
    }

    return prisma.user.update({
      where: { id },
      data: updateData,
      select: userSelect,
    });
  }

  async delete(id: number, requesterId: number): Promise<void> {
    await this.findById(id);

    if (id === requesterId) {
      throw new ForbiddenError("Cannot delete your own account");
    }

    await prisma.user.delete({
      where: { id },
    });
  }
}
