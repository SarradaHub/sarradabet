import { NotFoundError } from "../../../core/errors/AppError";
import { RewardRepository } from "../../reward/repositories/RewardRepository";
import { TicketVerifyService } from "../services/TicketVerifyService";

describe("TicketVerifyService", () => {
  const repository = new RewardRepository();
  const service = new TicketVerifyService(repository);

  it("returns validated ticket details", async () => {
    jest.spyOn(repository, "findRedemptionByTicketCode").mockResolvedValue({
      id: 1,
      rewardId: 2,
      userId: 10,
      ticketCode: "abc-123",
      redeemedAt: new Date("2026-07-15T18:00:00Z"),
      validatedAt: new Date("2026-07-16T12:00:00Z"),
      validatedBy: 99,
      reward: { title: "Camisa Oficial" },
      user: {
        id: 10,
        username: "pedro",
        email: "pedro@sarradabet.com",
      },
    } as never);

    const result = await service.verify("abc-123");

    expect(result.isValid).toBe(true);
    expect(result.status).toBe("VALIDATED");
    expect(result.userEmail).toBe("p***@sarradabet.com");
    expect(result.rewardTitle).toBe("Camisa Oficial");
  });

  it("throws when ticket does not exist", async () => {
    jest
      .spyOn(repository, "findRedemptionByTicketCode")
      .mockResolvedValue(null);

    await expect(service.verify("missing")).rejects.toThrow(NotFoundError);
  });
});
