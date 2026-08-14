import { prisma } from "../../../config/db";
import type { OAuthProfile } from "../oauth/OAuthProviderStrategy";

export class OAuthAccountRepository {
  async findByProvider(profile: Pick<OAuthProfile, "provider" | "providerAccountId">) {
    return prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: profile.provider,
          providerAccountId: profile.providerAccountId,
        },
      },
      include: {
        user: true,
      },
    });
  }

  async link(userId: number, profile: OAuthProfile) {
    return prisma.oAuthAccount.create({
      data: {
        userId,
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
      },
    });
  }

  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async createUserFromOAuth(profile: OAuthProfile, username: string) {
    return prisma.user.create({
      data: {
        username,
        email: profile.email,
        role: "USER",
      },
    });
  }

  async isUsernameTaken(username: string) {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    return Boolean(user);
  }
}
