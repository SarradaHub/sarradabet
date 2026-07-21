import crypto from "crypto";
import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

export interface UserAuthPayload {
  userId: number;
  username: string;
  email: string;
  role: UserRole;
  jti?: string;
}

export interface DecodedAccessToken extends UserAuthPayload {
  jti: string;
  exp: number;
  iat: number;
}

export interface AuthToken {
  token: string;
  expiresIn: string;
}

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateAccessToken = (payload: UserAuthPayload): AuthToken => {
  const jti = crypto.randomUUID();
  const options: SignOptions = {
    expiresIn: JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
    issuer: "sarradabet-api",
    audience: "sarradabet-user",
    jwtid: jti,
  };
  const token = jwt.sign(payload, JWT_SECRET, options);

  return {
    token,
    expiresIn: JWT_ACCESS_EXPIRES_IN,
  };
};

export const decodeAccessToken = (token: string): DecodedAccessToken => {
  const decoded = jwt.decode(token) as DecodedAccessToken | null;
  if (!decoded || typeof decoded.exp !== "number") {
    throw new Error("Invalid token");
  }
  return decoded;
};

export const getAccessTokenRemainingTtlSeconds = (token: string): number => {
  const decoded = decodeAccessToken(token);
  const remainingMs = decoded.exp * 1000 - Date.now();
  return Math.max(0, Math.ceil(remainingMs / 1000));
};

export const verifyAccessToken = (token: string): UserAuthPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "sarradabet-api",
      audience: "sarradabet-user",
    }) as UserAuthPayload & { jti?: string };

    return {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
      jti: decoded.jti,
    };
  } catch {
    throw new Error("Invalid or expired token");
  }
};

export const generateRefreshToken = (): string => {
  return crypto.randomBytes(64).toString("hex");
};

export const hashRefreshToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const getRefreshTokenExpiryDate = (): Date => {
  const match = JWT_REFRESH_EXPIRES_IN.match(/^(\d+)([smhd])$/);
  if (!match) {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return new Date(Date.now() + value * multipliers[unit]);
};

export const getRefreshTokenMaxAgeMs = (): number => {
  return getRefreshTokenExpiryDate().getTime() - Date.now();
};

export const extractTokenFromHeader = (
  authHeader: string | undefined,
): string => {
  if (!authHeader) {
    throw new Error("Authorization header is required");
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    throw new Error(
      "Invalid authorization header format. Expected: Bearer <token>",
    );
  }

  return parts[1];
};
