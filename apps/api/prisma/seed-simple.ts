import { PrismaClient, UserRole, BetStatus } from "@prisma/client";
import { hashPassword } from "../src/utils/auth";

const prisma = new PrismaClient();

const SEED_BET_TITLES = [
  "Brasil vs Argentina - Quem ganha?",
  "Campeão da Champions League 2026",
  "Libertadores 2026 - Campeão",
] as const;

async function cleanupNonSeedBets(): Promise<void> {
  const betsToDelete = await prisma.bet.findMany({
    where: { title: { notIn: [...SEED_BET_TITLES] } },
    select: { id: true },
  });

  if (betsToDelete.length === 0) {
    return;
  }

  const betIds = betsToDelete.map((bet) => bet.id);
  const odds = await prisma.odd.findMany({
    where: { betId: { in: betIds } },
    select: { id: true },
  });
  const oddIds = odds.map((odd) => odd.id);

  if (oddIds.length > 0) {
    await prisma.vote.deleteMany({ where: { oddId: { in: oddIds } } });
  }

  await prisma.odd.deleteMany({ where: { betId: { in: betIds } } });
  await prisma.bet.deleteMany({ where: { id: { in: betIds } } });
}

async function ensureUser(data: {
  username: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  coinBalance: number;
}): Promise<void> {
  await prisma.user.upsert({
    where: { username: data.username },
    create: data,
    update: {
      email: data.email,
      phone: data.phone,
      passwordHash: data.passwordHash,
      role: data.role,
      coinBalance: data.coinBalance,
    },
  });
}

async function ensureCategory(title: string) {
  const existing = await prisma.category.findFirst({ where: { title } });
  if (existing) {
    return existing;
  }

  return prisma.category.create({ data: { title } });
}

async function ensureBet(
  categoryId: number,
  data: {
    title: string;
    description: string;
    odds: Array<{ title: string; value: number }>;
  },
): Promise<void> {
  const existing = await prisma.bet.findFirst({
    where: { title: data.title },
    include: { odds: true },
  });

  if (existing) {
    await prisma.bet.update({
      where: { id: existing.id },
      data: {
        status: BetStatus.open,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    return;
  }

  await prisma.bet.create({
    data: {
      title: data.title,
      description: data.description,
      status: BetStatus.open,
      categoryId,
      odds: {
        create: data.odds,
      },
    },
  });
}

async function main() {
  const passwordHash = await hashPassword("user123");
  const adminPasswordHash = await hashPassword("admin123");

  await ensureUser({
    username: "admin",
    email: "admin@sarradabet.com",
    phone: "5511999990001",
    passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      coinBalance: 10_000,
  });

  await ensureUser({
    username: "user",
    email: "user@sarradabet.com",
    phone: "5511999990002",
    passwordHash,
    role: UserRole.USER,
    coinBalance: 1000,
  });

  await ensureUser({
    username: "maria",
    email: "maria@sarradabet.com",
    phone: "5511999990003",
    passwordHash,
    role: UserRole.USER,
    coinBalance: 0,
  });

  const existingPackage = await prisma.coinPackage.findFirst({
    where: { name: "Pacote Básico" },
  });
  if (!existingPackage) {
    await prisma.coinPackage.create({
      data: {
        name: "Pacote Básico",
        amountCents: 500,
        coinsAmount: 100,
        isActive: true,
        sortOrder: 0,
      },
    });
  }

  const futebol = await ensureCategory("Futebol");

  await cleanupNonSeedBets();

  await ensureBet(futebol.id, {
    title: "Brasil vs Argentina - Quem ganha?",
    description: "Quem vence o clássico sul-americano?",
    odds: [
      { title: "Brasil", value: 2.1 },
      { title: "Argentina", value: 1.8 },
      { title: "Empate", value: 3.2 },
    ],
  });

  await ensureBet(futebol.id, {
    title: "Campeão da Champions League 2026",
    description: "Quem levanta a taça europeia?",
    odds: [
      { title: "Real Madrid", value: 2.5 },
      { title: "Manchester City", value: 2.2 },
      { title: "Barcelona", value: 3.0 },
    ],
  });

  await ensureBet(futebol.id, {
    title: "Libertadores 2026 - Campeão",
    description: "Campeão da Libertadores 2026",
    odds: [
      { title: "Flamengo", value: 2.0 },
      { title: "Palmeiras", value: 2.5 },
    ],
  });

  console.log(
    "Simple seed completed: users + Futebol category + 3 open bets + coin package",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
