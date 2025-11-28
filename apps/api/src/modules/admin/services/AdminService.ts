import { prisma } from "../../../config/db";
import {
  hashPassword,
  comparePassword,
  generateToken,
  AuthToken,
} from "../../../utils/auth";
import { BaseService } from "../../../core/base/BaseService";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../../../core/errors/AppError";

export interface CreateAdminInput {
  username: string;
  email: string;
  password: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface AdminWithToken {
  id: number;
  username: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  token: AuthToken;
}

export class AdminService extends BaseService<any, any, any> {
  constructor() {
    // AdminService uses Prisma directly and doesn't rely on BaseService repository methods
    // Provide a minimal no-op repository to satisfy the base class constructor

    super({} as any);
  }
  // Implement abstract signatures to satisfy BaseService type; not used here
  async findAll(): Promise<any> {
    return {
      data: [],
      meta: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }
  async findById(): Promise<any> {
    return {};
  }
  // Remove protected implementation at bottom; keep this public override only
  async create(data: CreateAdminInput): Promise<AdminWithToken> {
    // Validate input
    await this.validateBusinessRules(data);

    // Check if admin already exists
    const existingAdmin = await prisma.admin.findFirst({
      where: {
        OR: [{ username: data.username }, { email: data.email }],
      },
    });

    if (existingAdmin) {
      if (existingAdmin.username === data.username) {
        throw new ValidationError("Username already exists");
      }
      if (existingAdmin.email === data.email) {
        throw new ValidationError("Email already exists");
      }
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    const admin = await prisma.admin.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash,
      },
    });

    const token = generateToken({
      adminId: admin.id,
      username: admin.username,
      email: admin.email,
    });

    const { passwordHash: _ph1, ...adminWithoutPassword } = admin;
    void _ph1;
    return {
      ...adminWithoutPassword,
      token,
    };
  }

  async login(data: LoginInput): Promise<AdminWithToken> {
    // Validate input
    await this.validateBusinessRules(data);

    const admin = await prisma.admin.findFirst({
      where: {
        OR: [{ username: data.username }, { email: data.username }],
      },
    });

    if (!admin) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const isPasswordValid = await comparePassword(
      data.password,
      admin.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const token = generateToken({
      adminId: admin.id,
      username: admin.username,
      email: admin.email,
    });

    const { passwordHash: _ph2, ...adminWithoutPassword } = admin;
    void _ph2;
    return {
      ...adminWithoutPassword,
      token,
    };
  }

  async getById(id: number) {
    const admin = await prisma.admin.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      throw new NotFoundError("Admin", id);
    }

    return admin;
  }

  async getAll() {
    return prisma.admin.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async update(id: number, data: Partial<CreateAdminInput>) {
    const admin = await this.getById(id);
    void admin;
    // If updating password, hash it
    if (data.password) {
      data.password = await hashPassword(data.password);
    }

    if (data.username || data.email) {
      const existingAdmin = await prisma.admin.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                ...(data.username ? [{ username: data.username }] : []),
                ...(data.email ? [{ email: data.email }] : []),
              ],
            },
          ],
        },
      });

      if (existingAdmin) {
        if (data.username && existingAdmin.username === data.username) {
          throw new ValidationError("Username already exists");
        }
        if (data.email && existingAdmin.email === data.email) {
          throw new ValidationError("Email already exists");
        }
      }
    }

    const updatedAdmin = await prisma.admin.update({
      where: { id },
      data: {
        ...data,
        ...(data.password && { passwordHash: data.password }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedAdmin;
  }

  async delete(id: number): Promise<void> {
    await this.getById(id); // Check if exists

    await prisma.admin.delete({
      where: { id },
    });
  }

  public async validateBusinessRules(
    data: Partial<CreateAdminInput & LoginInput>,
  ): Promise<void> {
    const errors: string[] = [];

    // Username or email (for login) validation
    if (data.username) {
      if (
        typeof data.username !== "string" ||
        data.username.trim().length === 0
      ) {
        errors.push("Username or email is required");
      } else if (data.username.includes("@")) {
        // Allow email in the username field for login
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.username)) {
          errors.push("Invalid email format");
        }
      } else {
        if (data.username.length < 3) {
          errors.push("Username must be at least 3 characters long");
        } else if (data.username.length > 50) {
          errors.push("Username cannot exceed 50 characters");
        } else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
          errors.push(
            "Username can only contain letters, numbers, and underscores",
          );
        }
      }
    }

    // Email validation (for create/update flows)
    if (data.email) {
      if (typeof data.email !== "string" || data.email.trim().length === 0) {
        errors.push("Email is required");
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push("Invalid email format");
      }
    }

    // Password validation
    if (data.password) {
      if (typeof data.password !== "string" || data.password.length === 0) {
        errors.push("Password is required");
      } else if (data.password.length < 6) {
        errors.push("Password must be at least 6 characters long");
      } else if (data.password.length > 100) {
        errors.push("Password cannot exceed 100 characters");
      }
    }

    if (errors.length > 0) {
      throw new ValidationError("Validation failed", { errors });
    }
  }
}
