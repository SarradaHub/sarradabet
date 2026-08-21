import { config } from "../../../config/env";
import { getRedisClient } from "../../../config/redis";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../core/errors/AppError";
import { RewardRepository } from "../../reward/repositories/RewardRepository";
import {
  TicketImageService,
  type TicketImagePayload,
} from "./TicketImageService";

const REDEEMED_CACHE_PREFIX = "ticket:image:v4:redeemed:";
const VALIDATED_CACHE_PREFIX = "ticket:image:v4:validated:";

export class TicketImageCacheService {
  constructor(
    private readonly rewardRepository: RewardRepository = new RewardRepository(),
    private readonly ticketImageService: TicketImageService = new TicketImageService(),
  ) {}

  async getRedemptionImage(
    ticketCode: string,
    requestUserId: number,
  ): Promise<Buffer> {
    const redemption =
      await this.rewardRepository.findRedemptionByTicketCode(ticketCode);

    if (!redemption) {
      throw new NotFoundError("Ticket");
    }

    if (redemption.userId !== requestUserId) {
      throw new ForbiddenError("Você não tem permissão para acessar este ticket");
    }

    const cacheKey = `${REDEEMED_CACHE_PREFIX}${ticketCode}`;
    const cached = await this.getCachedImage(cacheKey);
    if (cached) {
      return cached;
    }

    const image = await this.ticketImageService.generateRedemptionImage(
      this.toPayload(redemption),
    );
    await this.setCachedImage(cacheKey, image);
    return image;
  }

  async getValidationImage(ticketCode: string): Promise<Buffer> {
    return this.buildValidationImage(ticketCode);
  }

  async getValidationImageForOwner(
    ticketCode: string,
    requestUserId: number,
  ): Promise<Buffer> {
    const redemption =
      await this.rewardRepository.findRedemptionByTicketCode(ticketCode);

    if (!redemption) {
      throw new NotFoundError("Ticket");
    }

    if (redemption.userId !== requestUserId) {
      throw new ForbiddenError("Você não tem permissão para acessar este ticket");
    }

    return this.buildValidationImage(ticketCode, redemption);
  }

  private async buildValidationImage(
    ticketCode: string,
    redemption?: Awaited<
      ReturnType<RewardRepository["findRedemptionByTicketCode"]>
    >,
  ): Promise<Buffer> {
    const record =
      redemption ??
      (await this.rewardRepository.findRedemptionByTicketCode(ticketCode));

    if (!record) {
      throw new NotFoundError("Ticket");
    }

    if (!record.validatedAt) {
      throw new BadRequestError(
        "Ticket ainda não foi validado. Gere a imagem após a validação.",
      );
    }

    const cacheKey = `${VALIDATED_CACHE_PREFIX}${ticketCode}`;
    const cached = await this.getCachedImage(cacheKey);
    if (cached) {
      return cached;
    }

    const image = await this.ticketImageService.generateValidationImage(
      this.toPayload(record),
    );
    await this.setCachedImage(cacheKey, image);
    return image;
  }

  private toPayload(
    redemption: Awaited<
      ReturnType<RewardRepository["findRedemptionByTicketCode"]>
    >,
  ): TicketImagePayload {
    if (!redemption) {
      throw new NotFoundError("Ticket");
    }

    return {
      redemptionId: redemption.id,
      ticketCode: redemption.ticketCode,
      rewardTitle: redemption.reward.title,
      userEmail: redemption.user.email,
      username: redemption.user.username,
      redeemedAt: redemption.redeemedAt,
      validatedAt: redemption.validatedAt,
    };
  }

  private async getCachedImage(key: string): Promise<Buffer | null> {
    const redis = getRedisClient();
    if (!redis) {
      return null;
    }

    try {
      const cached = await redis.getBuffer(key);
      return cached ?? null;
    } catch {
      return null;
    }
  }

  private async setCachedImage(key: string, image: Buffer): Promise<void> {
    const redis = getRedisClient();
    if (!redis) {
      return;
    }

    try {
      await redis.setex(key, config.TICKET_IMAGE_CACHE_TTL, image);
    } catch {
      // Cache write is best-effort.
    }
  }
}

export function buildTicketImageUrl(ticketCode: string): string {
  return `/api/v1/rewards/tickets/${ticketCode}/image`;
}

export function buildValidateImageUrl(ticketCode: string): string {
  return `/api/v1/admin/rewards/tickets/${ticketCode}/validate-image`;
}

export function buildUserValidateImageUrl(ticketCode: string): string {
  return `/api/v1/rewards/tickets/${ticketCode}/validate-image`;
}
