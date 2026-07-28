import {
  PrismaClient,
  BetStatus,
  OddResult,
  UserRole,
  VoteStatus,
} from "@prisma/client";
import { calculateOddsFromStakes } from "../src/utils/parimutuel";
import { hashPassword } from "../src/utils/auth";
import { houseTreasuryService } from "../src/modules/coin/services/HouseTreasuryService";
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

type SeedVote = {
  userId: number;
  amount: number;
  createdAt?: Date;
  status?: VoteStatus;
  payoutAmount?: number;
  paidAt?: Date;
};

async function createOddsForBet(
  betId: number,
  titles: string[],
  stakeAmounts: number[],
  results?: OddResult[],
) {
  const values = calculateOddsFromStakes(stakeAmounts);

  return Promise.all(
    titles.map((title, index) =>
      prisma.odd.create({
        data: {
          title,
          value: values[index],
          betId,
          ...(results ? { result: results[index] } : {}),
        },
      }),
    ),
  );
}

async function seedVotes(oddId: number, votes: SeedVote[]) {
  await Promise.all(
    votes.map((vote) =>
      prisma.vote.create({
        data: {
          oddId,
          userId: vote.userId,
          amount: vote.amount,
          status: vote.status ?? VoteStatus.pending,
          payoutAmount: vote.payoutAmount,
          paidAt: vote.paidAt,
          createdAt: vote.createdAt ?? new Date(),
        },
      }),
    ),
  );
}

async function createUsers(): Promise<SeedUsers> {
  const [adminPasswordHash, userPasswordHash] = await Promise.all([
    hashPassword("admin123"),
    hashPassword("user123"),
  ]);

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
  console.log("🏆 Seeding leaderboard stats (from resolved Copa do Brasil)...");
  await seedUserStats(users.user.id, 900, 1, 0);
  await seedUserStats(users.admin.id, 900, 1, 0);
  await seedUserStats(users.joao.id, 750, 1, 0);
  await seedUserStats(users.maria.id, 800, 0, 1);
  await seedUserStats(users.pedro.id, 600, 0, 1);
  await seedUserStats(users.lucas.id, 550, 0, 0);

  console.log("🎁 Seeding rewards catalog...");
  const rewards = await Promise.all([
    prisma.reward.create({
      data: {
        title: "Camisa Oficial",
        description: "Camisa autografada do time campeão",
        coinCost: 1000,
        stock: 10,
        isActive: true,
      },
    }),
    prisma.reward.create({
      data: {
        title: "Boné SarradaBet",
        description: "Boné exclusivo da plataforma",
        coinCost: 500,
        stock: 20,
        isActive: true,
      },
    }),
    prisma.reward.create({
      data: {
        title: "Caneca Exclusiva",
        description: "Caneca térmica edição limitada",
        coinCost: 250,
        stock: 4,
        isActive: true,
      },
    }),
    prisma.reward.create({
      data: {
        title: "Ingresso VIP",
        description: "Ingresso para evento especial (esgotado)",
        coinCost: 2000,
        stock: 0,
        isActive: true,
      },
    }),
  ]);

  console.log("🎫 Seeding sample reward redemption...");
  await prisma.rewardRedemption.create({
    data: {
      rewardId: rewards[2].id,
      userId: users.pedro.id,
      ticketCode: "550e8400-e29b-41d4-a716-446655440000",
      redeemedAt: new Date("2026-07-15"),
    },
  });
}

async function main() {
  console.log("🌱 Starting database seeding...");

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

  console.log("👤 Creating users...");
  const users = await createUsers();

  console.log("📂 Creating category...");
  const futebol = await prisma.category.create({
    data: { title: "Futebol", createdAt: new Date("2026-01-01") },
  });

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
    [200, 200],
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

  const brasileiraoBet = await prisma.bet.create({
    data: {
      title: "Brasileirão 2026 - Campeão",
      description: "Série A 2026",
      status: BetStatus.closed,
      categoryId: futebol.id,
      startTime: new Date("2026-05-15"),
      createdAt: new Date("2026-05-15"),
      closesAt: new Date("2026-06-15"),
    },
  });

  const brasileiraoOdds = await createOddsForBet(
    brasileiraoBet.id,
    ["Botafogo", "Palmeiras"],
    [150, 150],
  );

  await seedVotes(brasileiraoOdds[0].id, [
    { userId: users.user.id, amount: 75, createdAt: new Date("2026-05-20") },
    { userId: users.pedro.id, amount: 75, createdAt: new Date("2026-05-21") },
  ]);
  await seedVotes(brasileiraoOdds[1].id, [
    { userId: users.joao.id, amount: 75, createdAt: new Date("2026-05-20") },
    { userId: users.lucas.id, amount: 75, createdAt: new Date("2026-05-22") },
  ]);

  const copaDoBrasilBet = await prisma.bet.create({
    data: {
      title: "Copa do Brasil 2026 - Zebra da Série B",
      description: "Edição 2026",
      status: BetStatus.resolved,
      categoryId: futebol.id,
      startTime: new Date("2026-04-01"),
      closesAt: new Date("2026-07-01"),
      createdAt: new Date("2026-04-01"),
      resolvedAt: new Date("2026-07-10"),
    },
  });

  const copaDoBrasilOdds = await createOddsForBet(
    copaDoBrasilBet.id,
    ["Sim", "Não"],
    [50, 450],
    [OddResult.lost, OddResult.won],
  );

  await seedVotes(copaDoBrasilOdds[0].id, [
    {
      userId: users.maria.id,
      amount: 50,
      status: VoteStatus.lost,
      createdAt: new Date("2026-04-05"),
    },
    {
      userId: users.pedro.id,
      amount: 50,
      status: VoteStatus.lost,
      createdAt: new Date("2026-04-06"),
    },
  ]);
  await seedVotes(copaDoBrasilOdds[1].id, [
    {
      userId: users.user.id,
      amount: 150,
      status: VoteStatus.paid,
      payoutAmount: 119,
      paidAt: new Date("2026-07-10"),
      createdAt: new Date("2026-04-05"),
    },
    {
      userId: users.admin.id,
      amount: 150,
      status: VoteStatus.paid,
      payoutAmount: 119,
      paidAt: new Date("2026-07-10"),
      createdAt: new Date("2026-04-06"),
    },
    {
      userId: users.joao.id,
      amount: 150,
      status: VoteStatus.paid,
      payoutAmount: 119,
      paidAt: new Date("2026-07-10"),
      createdAt: new Date("2026-04-07"),
    },
  ]);

  await prisma.$transaction(async (tx) => {
    await houseTreasuryService.creditTakeoutForBet(tx, copaDoBrasilBet.id);
  });

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

  await prisma.userAction.create({
    data: {
      userId: users.admin.id,
      actionType: "CREATE_BET",
      targetId: copaBet.id,
      description: "Created bet: Brasil vs Argentina - Copa América 2026",
      createdAt: new Date("2026-04-10"),
    },
  });

  await prisma.userAction.create({
    data: {
      userId: users.admin.id,
      actionType: "RESOLVE_BET",
      targetId: copaDoBrasilBet.id,
      description: "Resolved bet: Copa do Brasil 2026 - Zebra da Série B",
      createdAt: new Date("2026-07-10"),
    },
  });

  await seedGamification(users);

  const totalBets = await prisma.bet.count();
  const totalOdds = await prisma.odd.count();
  const totalVotes = await prisma.vote.count();
  const totalUsers = await prisma.user.count();
  const totalRewards = await prisma.reward.count();

  console.log("\n🎉 Seeding completed successfully!");
  console.log("📊 Database Summary:");
  console.log("   - Category: Futebol");
  console.log("   - Users: 6 (1 admin + 5 regular)");
  console.log("   - Coin package: Pacote Básico (R$ 5,00 → 100 moedas)");
  console.log("   - House user: house (takeout treasury)");
  console.log(`   - Bets: ${totalBets} (3 open, 1 scheduled, 1 closed, 1 resolved)`);
  console.log(`   - Odds: ${totalOdds}`);
  console.log(`   - Votes: ${totalVotes}`);
  console.log("   - User stats: 6 rows (wins/losses from resolved Copa do Brasil)");
  console.log(`   - Rewards: ${totalRewards} (3 in stock, 1 out of stock)`);
  console.log(
    "   - Reward redemption: 1 pending ticket for pedro (550e8400-e29b-41d4-a716-446655440000)",
  );
  console.log(`   - Total users in DB: ${totalUsers}`);
  console.log("\n🚀 Your database is now ready for testing!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
