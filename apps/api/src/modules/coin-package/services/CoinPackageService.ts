import {
  BadRequestError,
  NotFoundError,
} from "../../../core/errors/AppError";
import {
  CreateCoinPackageInput,
  UpdateCoinPackageInput,
} from "../../../core/validation/ValidationSchemas";
import { CoinPackageRepository } from "../repositories/CoinPackageRepository";

export class CoinPackageService {
  constructor(
    private readonly repository: CoinPackageRepository = new CoinPackageRepository(),
  ) {}

  listActive() {
    return this.repository.findActive();
  }

  listAll() {
    return this.repository.findAll();
  }

  async getActiveById(id: number) {
    const coinPackage = await this.repository.findActiveById(id);
    if (!coinPackage) {
      throw new NotFoundError("Coin package", id);
    }
    return coinPackage;
  }

  async create(data: CreateCoinPackageInput) {
    this.validateAmounts(data.amountCents, data.coinsAmount);
    return this.repository.create(data);
  }

  async update(id: number, data: UpdateCoinPackageInput) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("Coin package", id);
    }

    if (data.amountCents !== undefined || data.coinsAmount !== undefined) {
      this.validateAmounts(
        data.amountCents ?? existing.amountCents,
        data.coinsAmount ?? existing.coinsAmount,
      );
    }

    if (data.isActive === false) {
      await this.ensureNotLastActivePackage(id);
    }

    return this.repository.update(id, data);
  }

  async deactivate(id: number) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("Coin package", id);
    }

    await this.ensureNotLastActivePackage(id);
    return this.repository.deactivate(id);
  }

  private validateAmounts(amountCents: number, coinsAmount: number) {
    if (amountCents <= 0 || coinsAmount <= 0) {
      throw new BadRequestError("Amount and coins must be greater than zero");
    }
  }

  private async ensureNotLastActivePackage(id: number) {
    const activeCount = await this.repository.countActive();
    const target = await this.repository.findById(id);

    if (target?.isActive && activeCount <= 1) {
      throw new BadRequestError("Cannot deactivate the last active coin package");
    }
  }
}
