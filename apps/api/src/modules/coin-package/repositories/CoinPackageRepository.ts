import { prisma } from "../../../config/db";
import { CreateCoinPackageInput, UpdateCoinPackageInput } from "../../../core/validation/ValidationSchemas";

export class CoinPackageRepository {
  async findActive() {
    return prisma.coinPackage.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
  }

  async findAll() {
    return prisma.coinPackage.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
  }

  async findById(id: number) {
    return prisma.coinPackage.findUnique({ where: { id } });
  }

  async findActiveById(id: number) {
    return prisma.coinPackage.findFirst({
      where: { id, isActive: true },
    });
  }

  async countActive() {
    return prisma.coinPackage.count({ where: { isActive: true } });
  }

  async create(data: CreateCoinPackageInput) {
    return prisma.coinPackage.create({
      data: {
        name: data.name,
        amountCents: data.amountCents,
        coinsAmount: data.coinsAmount,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  async update(id: number, data: UpdateCoinPackageInput) {
    return prisma.coinPackage.update({
      where: { id },
      data,
    });
  }

  async deactivate(id: number) {
    return prisma.coinPackage.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
