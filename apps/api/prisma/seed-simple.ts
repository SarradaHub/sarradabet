import { PrismaClient, BetStatus } from "@prisma/client";
import { calculateOddsFromVotes } from "../src/utils/odds";

const prisma = new PrismaClient();

async function createOddsForBet(
  betId: number,
  titles: string[],
  voteCounts: number[],
) {
  const values = calculateOddsFromVotes(voteCounts);

  return Promise.all(
    titles.map((title, index) =>
      prisma.odd.create({
        data: { title, value: values[index], betId },
      }),
    ),
  );
}

async function main() {
  console.log("🌱 Starting simple database seeding...");

  console.log("🧹 Clearing existing data...");
  await prisma.vote.deleteMany();
  await prisma.odd.deleteMany();
  await prisma.bet.deleteMany();
  await prisma.category.deleteMany();

  console.log("📂 Creating sports categories...");
  const futebol = await prisma.category.create({
    data: { title: "Futebol" },
  });

  const basquete = await prisma.category.create({
    data: { title: "Basquete" },
  });

  const mma = await prisma.category.create({
    data: { title: "MMA" },
  });

  console.log("🎲 Creating sample sports bets...");

  const bet1 = await prisma.bet.create({
    data: {
      title: "Brasil vs Argentina - Quem ganha?",
      description: "Final da Copa América 2024",
      status: BetStatus.open,
      categoryId: futebol.id,
    },
  });

  const bet1Odds = await createOddsForBet(
    bet1.id,
    ["Brasil", "Argentina"],
    [2, 1],
  );

  await Promise.all([
    prisma.vote.create({ data: { oddId: bet1Odds[0].id } }),
    prisma.vote.create({ data: { oddId: bet1Odds[0].id } }),
    prisma.vote.create({ data: { oddId: bet1Odds[1].id } }),
  ]);

  const bet2 = await prisma.bet.create({
    data: {
      title: "Final da NBA 2024",
      description: "Celtics ou Mavericks?",
      status: BetStatus.open,
      categoryId: basquete.id,
    },
  });

  await createOddsForBet(bet2.id, ["Boston Celtics", "Dallas Mavericks"], [0, 0]);

  const bet3 = await prisma.bet.create({
    data: {
      title: "UFC 300 - Vencedor do Main Event",
      description: "Quem vence a luta principal?",
      status: BetStatus.open,
      categoryId: mma.id,
    },
  });

  await createOddsForBet(
    bet3.id,
    ["Alex Pereira", "Jamahal Hill", "Vitória no 1º round"],
    [0, 0, 0],
  );

  console.log("✅ Seeding completed!");
  console.log("📊 Created:");
  console.log("   - 3 sports categories (Futebol, Basquete, MMA)");
  console.log("   - 3 sports bets");
  console.log("   - 7 odds");
  console.log("   - 3 votes");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
