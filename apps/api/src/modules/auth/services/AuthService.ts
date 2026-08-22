import { UserRole } from "@prisma/client";
import { prisma } from "../../../config/db";
import {
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiryDate,
  hashPassword,
  hashRefreshToken,
  UserAuthPayload,
} from "../../../utils/auth";
import {
  UnauthorizedError,
  ValidationError,
} from "../../../core/errors/AppError";

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  phone: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface AuthResult {
  user: {
    id: number;
    username: string;
    email: string;
    phone: string;
    role: UserRole;
    coinBalance: number;
    createdAt: Date;
    updatedAt: Date;
  };
  accessToken: {
    token: string;
    expiresIn: string;
  };
  refreshToken: string;
}

export class AuthService {
  async register(data: RegisterInput): Promise<AuthResult> {
    await this.ensureUniqueUser(data.username, data.email, data.phone);

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        phone: data.phone,
        passwordHash,
        role: UserRole.USER,
      },
    });

    return this.issueTokens(user);
  }

  async login(data: LoginInput): Promise<AuthResult> {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: data.username }, { email: data.username }],
      },
    });

    if (!user) {
      throw new UnauthorizedError("Usuário ou senha inválidos.");
    }

    const isPasswordValid = await comparePassword(
      data.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedError("Usuário ou senha inválidos.");
    }

    return this.issueTokens(user);
  }

  async refresh(rawRefreshToken: string): Promise<AuthResult> {
    const tokenHash = hashRefreshToken(rawRefreshToken);

    const existingToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!existingToken) {
      throw new UnauthorizedError("Sessão expirada. Faça login novamente.");
    }

    if (existingToken.revokedAt) {
      await this.revokeAllUserRefreshTokens(existingToken.userId);
      throw new UnauthorizedError("Sessão inválida. Faça login novamente.");
    }

    if (existingToken.expiresAt <= new Date()) {
      throw new UnauthorizedError("Sessão expirada. Faça login novamente.");
    }

    const { user } = existingToken;

    return prisma.$transaction(async (tx) => {
      const newRawToken = generateRefreshToken();
      const newTokenHash = hashRefreshToken(newRawToken);
      const expiresAt = getRefreshTokenExpiryDate();

      const newRefreshToken = await tx.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: newTokenHash,
          expiresAt,
        },
      });

      await tx.refreshToken.update({
        where: { id: existingToken.id },
        data: {
          revokedAt: new Date(),
          replacedByTokenId: newRefreshToken.id,
        },
      });

      const payload: UserAuthPayload = {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      };

      return {
        user: this.toPublicUser(user),
        accessToken: generateAccessToken(payload),
        refreshToken: newRawToken,
      };
    });
  }

  async logout(rawRefreshToken: string | undefined): Promise<void> {
    if (!rawRefreshToken) {
      return;
    }

    const tokenHash = hashRefreshToken(rawRefreshToken);
    const existingToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!existingToken || existingToken.revokedAt) {
      return;
    }

    await prisma.refreshToken.update({
      where: { id: existingToken.id },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokens(user: {
    id: number;
    username: string;
    email: string;
    phone: string;
    role: UserRole;
    coinBalance: number;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<AuthResult> {
    const rawRefreshToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const expiresAt = getRefreshTokenExpiryDate();

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const payload: UserAuthPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    return {
      user: this.toPublicUser(user),
      accessToken: generateAccessToken(payload),
      refreshToken: rawRefreshToken,
    };
  }

  private async ensureUniqueUser(
    username: string,
    email: string,
    phone: string,
  ): Promise<void> {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }, { phone }],
      },
    });

    if (existingUser) {
      if (existingUser.username === username) {
        throw new ValidationError("Este usuário já está cadastrado.");
      }
      if (existingUser.email === email) {
        throw new ValidationError("Este e-mail já está cadastrado.");
      }
      if (existingUser.phone === phone) {
        throw new ValidationError("Este telefone já está cadastrado.");
      }
    }
  }

  private async revokeAllUserRefreshTokens(userId: number): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  private toPublicUser(user: {
    id: number;
    username: string;
    email: string;
    phone: string;
    role: UserRole;
    coinBalance: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      coinBalance: user.coinBalance,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
