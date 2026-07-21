import { PrismaClient, BetStatus, OddResult, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function seedVotes(
  oddId: number,
  count: number,
  maxAgeMs = 86400000,
) {
  await Promise.all(
    Array(count)
      .fill(null)
      .map(() =>
        prisma.vote.create({
          data: {
            oddId,
            createdAt: new Date(Date.now() - Math.random() * maxAgeMs),
          },
        }),
      ),
  );
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
  await prisma.coinPackage.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.userAction.deleteMany();
  await prisma.user.deleteMany();

  console.log("📂 Creating sports categories...");
  const categories = await Promise.all([
    prisma.category.create({
      data: { title: "Futebol", createdAt: new Date("2024-01-01") },
    }),
    prisma.category.create({
      data: { title: "Basquete", createdAt: new Date("2024-01-02") },
    }),
    prisma.category.create({
      data: { title: "MMA", createdAt: new Date("2024-01-03") },
    }),
    prisma.category.create({
      data: { title: "Tênis", createdAt: new Date("2024-01-04") },
    }),
    prisma.category.create({
      data: { title: "Fórmula 1", createdAt: new Date("2024-01-05") },
    }),
    prisma.category.create({
      data: { title: "Vôlei", createdAt: new Date("2024-01-06") },
    }),
  ]);

  const [futebol, basquete, mma, tenis, formula1, volei] = categories;

  console.log(`✅ Created ${categories.length} sports categories`);

  console.log("🎲 Creating sports bets...");

  // Active football final with votes
  const copaBet = await prisma.bet.create({
    data: {
      title: "Brasil vs Argentina - Copa América 2024",
      description: "Quem será o vencedor da final da Copa América?",
      status: BetStatus.open,
      categoryId: futebol.id,
      createdAt: new Date("2024-01-15"),
    },
  });

  const copaOdds = await Promise.all([
    prisma.odd.create({
      data: {
        title: "Brasil",
        value: 2.1,
        betId: copaBet.id,
        createdAt: new Date("2024-01-15"),
      },
    }),
    prisma.odd.create({
      data: {
        title: "Argentina",
        value: 1.8,
        betId: copaBet.id,
        createdAt: new Date("2024-01-15"),
      },
    }),
    prisma.odd.create({
      data: {
        title: "Empate",
        value: 3.2,
        betId: copaBet.id,
        createdAt: new Date("2024-01-15"),
      },
    }),
  ]);

  await seedVotes(copaOdds[0].id, 5);
  await seedVotes(copaOdds[1].id, 3);
  await seedVotes(copaOdds[2].id, 1);

  // Close NBA finals race
  const nbaBet = await prisma.bet.create({
    data: {
      title: "Final da NBA 2024 - Campeão",
      description: "Qual time será campeão da NBA?",
      status: BetStatus.open,
      categoryId: basquete.id,
      createdAt: new Date("2024-01-10"),
    },
  });

  const nbaOdds = await Promise.all([
    prisma.odd.create({
      data: {
        title: "Boston Celtics",
        value: 1.5,
        betId: nbaBet.id,
        createdAt: new Date("2024-01-10"),
      },
    }),
    prisma.odd.create({
      data: {
        title: "Dallas Mavericks",
        value: 1.6,
        betId: nbaBet.id,
        createdAt: new Date("2024-01-10"),
      },
    }),
  ]);

  await seedVotes(nbaOdds[0].id, 7, 172800000);
  await seedVotes(nbaOdds[1].id, 8, 172800000);

  // MMA card with high odds underdog
  const ufcBet = await prisma.bet.create({
    data: {
      title: "UFC 300 - Vencedor do Main Event",
      description: "Quem vence a luta principal do UFC 300?",
      status: BetStatus.open,
      categoryId: mma.id,
      createdAt: new Date("2024-01-20"),
    },
  });

  const ufcOdds = await Promise.all([
    prisma.odd.create({
      data: {
        title: "Alex Pereira",
        value: 2.5,
        betId: ufcBet.id,
        createdAt: new Date("2024-01-20"),
      },
    }),
    prisma.odd.create({
      data: {
        title: "Jamahal Hill",
        value: 4.2,
        betId: ufcBet.id,
        createdAt: new Date("2024-01-20"),
      },
    }),
    prisma.odd.create({
      data: {
        title: "Empate técnico",
        value: 6.8,
        betId: ufcBet.id,
        createdAt: new Date("2024-01-20"),
      },
    }),
    prisma.odd.create({
      data: {
        title: "Vitória no 1º round",
        value: 12.5,
        betId: ufcBet.id,
        createdAt: new Date("2024-01-20"),
      },
    }),
  ]);

  await seedVotes(ufcOdds[0].id, 2, 259200000);
  await seedVotes(ufcOdds[1].id, 1, 259200000);

  // Resolved tennis Grand Slam
  const rolandBet = await prisma.bet.create({
    data: {
      title: "Roland Garros 2024 - Campeão masculino",
      description: "Quem vence o título de simples masculino?",
      status: BetStatus.resolved,
      categoryId: tenis.id,
      createdAt: new Date("2024-01-05"),
      resolvedAt: new Date("2024-01-25"),
    },
  });

  const rolandOdds = await Promise.all([
    prisma.odd.create({
      data: {
        title: "Carlos Alcaraz",
        value: 1.2,
        betId: rolandBet.id,
        result: OddResult.won,
        createdAt: new Date("2024-01-05"),
      },
    }),
    prisma.odd.create({
      data: {
        title: "Novak Djokovic",
        value: 4.5,
        betId: rolandBet.id,
        result: OddResult.lost,
        createdAt: new Date("2024-01-05"),
      },
    }),
  ]);

  await seedVotes(rolandOdds[0].id, 15, 86400000 * 7);
  await seedVotes(rolandOdds[1].id, 3, 86400000 * 7);

  // Closed F1 championship
  const f1Bet = await prisma.bet.create({
    data: {
      title: "F1 2024 - Campeão do Mundial",
      description: "Quem será campeão da Fórmula 1 em 2024?",
      status: BetStatus.closed,
      categoryId: formula1.id,
      createdAt: new Date("2024-01-08"),
    },
  });

  const f1Odds = await Promise.all([
    prisma.odd.create({
      data: {
        title: "Max Verstappen",
        value: 2.8,
        betId: f1Bet.id,
        createdAt: new Date("2024-01-08"),
      },
    }),
    prisma.odd.create({
      data: {
        title: "Lando Norris",
        value: 1.4,
        betId: f1Bet.id,
        createdAt: new Date("2024-01-08"),
      },
    }),
  ]);

  await seedVotes(f1Odds[0].id, 4, 86400000 * 5);
  await seedVotes(f1Odds[1].id, 6, 86400000 * 5);

  // New volleyball bet with no votes
  const voleiBet = await prisma.bet.create({
    data: {
      title: "Superliga Masculina 2024 - Campeão",
      description: "Qual time vence a Superliga de vôlei?",
      status: BetStatus.open,
      categoryId: volei.id,
      createdAt: new Date(Date.now() - 3600000),
    },
  });

  await Promise.all([
    prisma.odd.create({
      data: {
        title: "Sada Cruzeiro",
        value: 3.5,
        betId: voleiBet.id,
        createdAt: new Date(Date.now() - 3600000),
      },
    }),
    prisma.odd.create({
      data: {
        title: "Funvic Taubaté",
        value: 2.2,
        betId: voleiBet.id,
        createdAt: new Date(Date.now() - 3600000),
      },
    }),
    prisma.odd.create({
      data: {
        title: "Minas Tênis Clube",
        value: 4.1,
        betId: voleiBet.id,
        createdAt: new Date(Date.now() - 3600000),
      },
    }),
  ]);

  // Champions League multi-team
  const championsBet = await prisma.bet.create({
    data: {
      title: "Campeão da Champions League 2024",
      description: "Qual time será campeão da Champions League?",
      status: BetStatus.open,
      categoryId: futebol.id,
      createdAt: new Date(Date.now() - 7200000),
    },
  });

  const championsOdds = await Promise.all([
    prisma.odd.create({
      data: {
        title: "Real Madrid",
        value: 3.2,
        betId: championsBet.id,
        createdAt: new Date(Date.now() - 7200000),
      },
    }),
    prisma.odd.create({
      data: {
        title: "Manchester City",
        value: 2.8,
        betId: championsBet.id,
        createdAt: new Date(Date.now() - 7200000),
      },
    }),
    prisma.odd.create({
      data: {
        title: "Bayern Munich",
        value: 4.5,
        betId: championsBet.id,
        createdAt: new Date(Date.now() - 7200000),
      },
    }),
    prisma.odd.create({
      data: {
        title: "PSG",
        value: 6.0,
        betId: championsBet.id,
        createdAt: new Date(Date.now() - 7200000),
      },
    }),
  ]);

  await seedVotes(championsOdds[0].id, 3, 3600000);
  await seedVotes(championsOdds[1].id, 2, 3600000);
  await seedVotes(championsOdds[2].id, 1, 3600000);

  // High odds underdog - Série B Copa do Brasil
  const underdogBet = await prisma.bet.create({
    data: {
      title: "Time da Série B será campeão da Copa do Brasil",
      description: "Um time da Série B conseguirá ganhar a Copa do Brasil?",
      status: BetStatus.open,
      categoryId: futebol.id,
      createdAt: new Date(Date.now() - 1800000),
    },
  });

  const underdogOdds = await Promise.all([
    prisma.odd.create({
      data: {
        title: "Sim",
        value: 15.0,
        betId: underdogBet.id,
        createdAt: new Date(Date.now() - 1800000),
      },
    }),
    prisma.odd.create({
      data: {
        title: "Não",
        value: 1.05,
        betId: underdogBet.id,
        createdAt: new Date(Date.now() - 1800000),
      },
    }),
  ]);

  await prisma.vote.create({
    data: {
      oddId: underdogOdds[0].id,
      createdAt: new Date(Date.now() - 900000),
    },
  });

  console.log("✅ Created sports bet scenarios:");
  console.log("  - Copa América final (futebol, ativa)");
  console.log("  - NBA Finals (basquete, corrida apertada)");
  console.log("  - UFC 300 main event (MMA, odds altas)");
  console.log("  - Roland Garros (tênis, resolvida)");
  console.log("  - F1 campeonato (Fórmula 1, fechada)");
  console.log("  - Superliga vôlei (sem votos)");
  console.log("  - Champions League (futebol)");
  console.log("  - Zebra Série B na Copa (futebol)");

  console.log("👤 Creating users...");
  const { hashPassword } = await import("../src/utils/auth");
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

  const admin = await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@sarradabet.com",
      phone: "5511999990001",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      createdAt: new Date("2024-01-01"),
    },
  });

  await prisma.user.create({
    data: {
      username: "user",
      email: "user@sarradabet.com",
      phone: "5511999990002",
      passwordHash: userPasswordHash,
      role: UserRole.USER,
      createdAt: new Date("2024-01-02"),
    },
  });

  await prisma.userAction.create({
    data: {
      userId: admin.id,
      actionType: "CREATE_BET",
      targetId: copaBet.id,
      description: "Created bet: Brasil vs Argentina - Copa América",
      createdAt: new Date("2024-01-15"),
    },
  });

  await prisma.userAction.create({
    data: {
      userId: admin.id,
      actionType: "RESOLVE_BET",
      targetId: rolandBet.id,
      description: "Resolved bet: Roland Garros 2024 champion",
      createdAt: new Date("2024-01-25"),
    },
  });

  const totalBets = await prisma.bet.count();
  const totalOdds = await prisma.odd.count();
  const totalVotes = await prisma.vote.count();
  const totalCategories = await prisma.category.count();

  console.log("\n🎉 Seeding completed successfully!");
  console.log(`📊 Database Summary:`);
  console.log(`   - Sports categories: ${totalCategories}`);
  console.log(`   - Bets: ${totalBets}`);
  console.log(`   - Odds: ${totalOdds}`);
  console.log(`   - Votes: ${totalVotes}`);
  console.log(`   - Users: 2 (admin, user)`);
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
