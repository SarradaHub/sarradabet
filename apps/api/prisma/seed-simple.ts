import { PrismaClient, BetStatus, UserRole } from "@prisma/client";
import { calculateOddsFromStakes } from "../src/utils/parimutuel";
import { hashPassword } from "../src/utils/auth";
import {
  calculateRankingScore,
  calculateWinRate,
} from "../src/modules/stats/utils/ranking";

const prisma = new PrismaClient();

type SeedUsers = {
  admin: { id: number };
  user: { id: number };
  maria: { id: number };
  joao: { id: number };
  pedro: { id: number };
  lucas: { id: number };
};

async function createOddsForBet(
  betId: number,
  titles: string[],
  stakeAmounts: number[],
) {
  const values = calculateOddsFromStakes(stakeAmounts);

  return Promise.all(
    titles.map((title, index) =>
      prisma.odd.create({
        data: { title, value: values[index], betId },
      }),
    ),
  );
}

async function seedVotes(
  oddId: number,
  votes: Array<{ userId: number; amount: number; createdAt?: Date }>,
) {
  await Promise.all(
    votes.map((vote) =>
      prisma.vote.create({
        data: {
          oddId,
          userId: vote.userId,
          amount: vote.amount,
          createdAt: vote.createdAt ?? new Date(),
        },
      }),
    ),
  );
}

async function createUsers(passwordHash: string): Promise<SeedUsers> {
  const adminPasswordHash = await hashPassword("admin123");
  const userPasswordHash = passwordHash;

  await prisma.coinPackage.create({
    data: {
      name: "Pacote Básico",
      amountCents: 500,
      coinsAmount: 100,
      isActive: true,
      sortOrder: 0,
    },
  });

  const housePasswordHash = await hashPassword("house-not-loginable");
  await prisma.user.create({
    data: {
      username: "house",
      email: "house@internal.sarradabet.local",
      phone: "5500000000000",
      passwordHash: housePasswordHash,
      role: UserRole.USER,
      coinBalance: 0,
      createdAt: new Date("2026-01-01"),
    },
  });

  const admin = await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@sarradabet.com",
      phone: "5511999990001",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      coinBalance: 900,
      createdAt: new Date("2026-01-01"),
    },
  });

  const user = await prisma.user.create({
    data: {
      username: "user",
      email: "user@sarradabet.com",
      phone: "5511999990002",
      passwordHash: userPasswordHash,
      role: UserRole.USER,
      coinBalance: 900,
      createdAt: new Date("2026-01-15"),
    },
  });

  const maria = await prisma.user.create({
    data: {
      username: "maria",
      email: "maria@sarradabet.com",
      phone: "5511999990003",
      passwordHash: userPasswordHash,
      role: UserRole.USER,
      coinBalance: 800,
      createdAt: new Date("2026-02-01"),
    },
  });

  const joao = await prisma.user.create({
    data: {
      username: "joao",
      email: "joao@sarradabet.com",
      phone: "5511999990004",
      passwordHash: userPasswordHash,
      role: UserRole.USER,
      coinBalance: 750,
      createdAt: new Date("2026-02-15"),
    },
  });

  const pedro = await prisma.user.create({
    data: {
      username: "pedro",
      email: "pedro@sarradabet.com",
      phone: "5511999990005",
      passwordHash: userPasswordHash,
      role: UserRole.USER,
      coinBalance: 600,
      createdAt: new Date("2026-03-01"),
    },
  });

  const lucas = await prisma.user.create({
    data: {
      username: "lucas",
      email: "lucas@sarradabet.com",
      phone: "5511999990006",
      passwordHash: userPasswordHash,
      role: UserRole.USER,
      coinBalance: 550,
      createdAt: new Date("2026-03-15"),
    },
  });

  return { admin, user, maria, joao, pedro, lucas };
}

async function seedUserStats(
  userId: number,
  coinBalance: number,
  wonBets: number,
  lostBets: number,
) {
  const totalBets = wonBets + lostBets;
  await prisma.userStats.create({
    data: {
      userId,
      totalBets,
      wonBets,
      lostBets,
      winRate: calculateWinRate(wonBets, totalBets),
      rankingScore: calculateRankingScore(wonBets, coinBalance),
    },
  });
}

async function seedGamification(users: SeedUsers) {
  console.log("🏆 Seeding leaderboard stats...");
  await seedUserStats(users.admin.id, 900, 5, 2);
  await seedUserStats(users.user.id, 900, 4, 3);
  await seedUserStats(users.maria.id, 800, 3, 2);
  await seedUserStats(users.joao.id, 750, 2, 3);
  await seedUserStats(users.pedro.id, 600, 1, 4);
  await seedUserStats(users.lucas.id, 550, 0, 0);

  console.log("🎁 Seeding rewards catalog...");
  await prisma.reward.createMany({
    data: [
      {
        title: "Camisa Oficial",
        description: "Camisa autografada do time campeão",
        coinCost: 1000,
        stock: 10,
        isActive: true,
      },
      {
        title: "Boné SarradaBet",
        description: "Boné exclusivo da plataforma",
        coinCost: 500,
        stock: 20,
        isActive: true,
      },
      {
        title: "Caneca Exclusiva",
        description: "Caneca térmica edição limitada",
        coinCost: 250,
        stock: 5,
        isActive: true,
      },
      {
        title: "Ingresso VIP",
        description: "Ingresso para evento especial (esgotado)",
        coinCost: 2000,
        stock: 0,
        isActive: true,
      },
    ],
  });
}

async function main() {
  console.log("🌱 Starting simple database seeding...");

  console.log("🧹 Clearing existing data...");
  await prisma.vote.deleteMany();
  await prisma.odd.deleteMany();
  await prisma.bet.deleteMany();
  await prisma.category.deleteMany();
  await prisma.pixPayment.deleteMany();
  await prisma.coinTransaction.deleteMany();
  await prisma.rewardRedemption.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.userStats.deleteMany();
  await prisma.coinPackage.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.userAction.deleteMany();
  await prisma.user.deleteMany();

  console.log("📂 Creating category...");
  const futebol = await prisma.category.create({
    data: { title: "Futebol", createdAt: new Date("2026-01-01") },
  });

  console.log("👤 Creating users...");
  const userPasswordHash = await hashPassword("user123");
  const users = await createUsers(userPasswordHash);

  console.log("🎲 Creating soccer bets (2026)...");

  const copaBet = await prisma.bet.create({
    data: {
      title: "Brasil vs Argentina - Quem ganha?",
      description: "Final da Copa América 2026",
      status: BetStatus.open,
      categoryId: futebol.id,
      startTime: new Date("2026-04-10T12:00:00Z"),
      closesAt: new Date("2026-08-31T23:59:00Z"),
      createdAt: new Date("2026-04-10"),
    },
  });

  const copaOdds = await createOddsForBet(
    copaBet.id,
    ["Brasil", "Argentina"],
    [250, 175],
  );

  await seedVotes(copaOdds[0].id, [
    { userId: users.user.id, amount: 100, createdAt: new Date("2026-04-11") },
    { userId: users.user.id, amount: 50, createdAt: new Date("2026-04-11T12:00:00Z") },
    { userId: users.admin.id, amount: 100, createdAt: new Date("2026-04-11") },
  ]);
  await seedVotes(copaOdds[1].id, [
    { userId: users.maria.id, amount: 100, createdAt: new Date("2026-04-12") },
    { userId: users.joao.id, amount: 100, createdAt: new Date("2026-04-12") },
    { userId: users.user.id, amount: 75, createdAt: new Date("2026-04-12T14:00:00Z") },
  ]);

  const championsBet = await prisma.bet.create({
    data: {
      title: "Campeão da Champions League 2026",
      description: "Final em maio/2026",
      status: BetStatus.open,
      categoryId: futebol.id,
      startTime: new Date("2026-05-01T12:00:00Z"),
      closesAt: new Date("2026-09-15T23:59:00Z"),
      createdAt: new Date("2026-05-01"),
    },
  });

  const championsOdds = await createOddsForBet(
    championsBet.id,
    ["Real Madrid", "Manchester City"],
    [200, 200],
  );

  await seedVotes(championsOdds[1].id, [
    { userId: users.maria.id, amount: 100, createdAt: new Date("2026-05-02") },
    { userId: users.pedro.id, amount: 100, createdAt: new Date("2026-05-02") },
  ]);
  await seedVotes(championsOdds[0].id, [
    { userId: users.joao.id, amount: 100, createdAt: new Date("2026-05-03") },
    { userId: users.lucas.id, amount: 100, createdAt: new Date("2026-05-03") },
  ]);

  const libertadoresBet = await prisma.bet.create({
    data: {
      title: "Libertadores 2026 - Campeão",
      description: "Conmebol 2026",
      status: BetStatus.open,
      categoryId: futebol.id,
      startTime: new Date("2026-06-01T12:00:00Z"),
      closesAt: new Date("2026-10-01T23:59:00Z"),
      createdAt: new Date("2026-06-01"),
    },
  });

  const libertadoresOdds = await createOddsForBet(
    libertadoresBet.id,
    ["Flamengo", "Palmeiras", "Boca Juniors"],
    [100, 100, 100],
  );

  await seedVotes(libertadoresOdds[0].id, [
    { userId: users.pedro.id, amount: 100, createdAt: new Date("2026-06-02") },
  ]);
  await seedVotes(libertadoresOdds[1].id, [
    { userId: users.lucas.id, amount: 100, createdAt: new Date("2026-06-02") },
  ]);
  await seedVotes(libertadoresOdds[2].id, [
    { userId: users.maria.id, amount: 100, createdAt: new Date("2026-06-03") },
  ]);

  const mundialBet = await prisma.bet.create({
    data: {
      title: "Mundial 2026 - Artilheiro",
      description: "Mercado agendado — ainda não aceita apostas",
      status: BetStatus.scheduled,
      categoryId: futebol.id,
      startTime: new Date("2026-08-01T18:00:00Z"),
      closesAt: new Date("2026-08-15T22:00:00Z"),
      createdAt: new Date("2026-06-10"),
    },
  });

  await createOddsForBet(mundialBet.id, ["Mbappé", "Endrick", "Haaland"], [0, 0, 0]);

  await seedGamification(users);

  const totalBets = await prisma.bet.count();
  const totalOdds = await prisma.odd.count();
  const totalVotes = await prisma.vote.count();
  const totalRewards = await prisma.reward.count();

  console.log("✅ Seeding completed!");
  console.log("📊 Created:");
  console.log("   - 1 category (Futebol)");
  console.log("   - 1 coin package (Pacote Básico)");
  console.log(`   - ${totalBets} bets (3 open, 1 scheduled)`);
  console.log(`   - ${totalOdds} odds`);
  console.log(`   - ${totalVotes} staked votes across 6 users`);
  console.log("   - 6 user stats rows (synthetic leaderboard data)");
  console.log(`   - ${totalRewards} rewards (3 in stock, 1 out of stock)`);
  console.log(
    "   - 6 users (admin/admin123, user+extras/user123) with preset coin balances",
  );
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
