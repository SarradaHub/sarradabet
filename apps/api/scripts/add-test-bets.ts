/**
 * Adds open/scheduled test bets to existing categories without wiping data.
 * Usage: npx tsx scripts/add-test-bets.ts
 */
import { BetStatus, PrismaClient } from "@prisma/client";
import { calculateOddsFromStakes } from "../src/utils/parimutuel";

const prisma = new PrismaClient();

function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function daysFromNow(days: number): Date {
  return hoursFromNow(days * 24);
}

async function createBetWithOdds(
  categoryId: number,
  title: string,
  description: string,
  status: BetStatus,
  closesAt: Date,
  startTime?: Date,
  oddTitles: string[] = ["Opção A", "Opção B"],
) {
  const values = calculateOddsFromStakes(oddTitles.map(() => 0));

  const bet = await prisma.bet.create({
    data: {
      title,
      description,
      status,
      categoryId,
      startTime,
      closesAt,
      odds: {
        create: oddTitles.map((oddTitle, index) => ({
          title: oddTitle,
          value: values[index],
        })),
      },
    },
    include: {
      odds: { select: { id: true, title: true } },
      category: { select: { id: true, title: true } },
    },
  });

  return bet;
}

async function main() {
  const categories = await prisma.category.findMany({
    orderBy: { id: "asc" },
    take: 3,
  });

  if (categories.length === 0) {
    console.error("No categories found. Run db:seed or db:seed:simple first.");
    process.exit(1);
  }

  const openCount = await prisma.bet.count({
    where: {
      status: { in: ["open", "scheduled"] },
      OR: [{ closesAt: null }, { closesAt: { gt: new Date() } }],
    },
  });

  if (openCount > 0) {
    console.log(`Skipping: ${openCount} open/scheduled bet(s) already exist.`);
    const existing = await prisma.bet.findMany({
      where: {
        status: { in: ["open", "scheduled"] },
        OR: [{ closesAt: null }, { closesAt: { gt: new Date() } }],
      },
      select: {
        id: true,
        title: true,
        status: true,
        closesAt: true,
        category: { select: { title: true } },
      },
      orderBy: { id: "asc" },
    });
    for (const bet of existing) {
      console.log(
        `  #${bet.id} [${bet.status}] ${bet.title} (${bet.category.title}) — closes ${bet.closesAt?.toISOString() ?? "—"}`,
      );
    }
    return;
  }

  const [cat1, cat2, cat3] = categories;
  const created = [];

  created.push(
    await createBetWithOdds(
      cat1.id,
      "Vencedor (1X2) — Teste",
      "Aposta aberta para testar votação na home",
      BetStatus.open,
      daysFromNow(3),
      hoursFromNow(-1),
      ["Time Casa", "Empate", "Time Visitante"],
    ),
  );

  created.push(
    await createBetWithOdds(
      cat1.id,
      "Over/Under 2.5 Gols — Teste",
      "Mercado de gols — fecha em 6 horas",
      BetStatus.open,
      hoursFromNow(6),
      undefined,
      ["Over 2.5", "Under 2.5"],
    ),
  );

  if (cat2) {
    created.push(
      await createBetWithOdds(
        cat2.id,
        "Quem faz o 1º gol? — Teste",
        "Aposta aberta na categoria 2",
        BetStatus.open,
        daysFromNow(5),
        undefined,
        ["Jogador A", "Jogador B", "Nenhum"],
      ),
    );
  }

  if (cat3) {
    created.push(
      await createBetWithOdds(
        cat3.id,
        "Resultado exato — Teste",
        "Aposta aberta na categoria 3",
        BetStatus.open,
        daysFromNow(7),
        undefined,
        ["2x1", "1x1", "0x2"],
      ),
    );

    created.push(
      await createBetWithOdds(
        cat3.id,
        "Aposta Agendada — Teste",
        "Abre em 2 horas — teste de status scheduled",
        BetStatus.scheduled,
        daysFromNow(2),
        hoursFromNow(2),
        ["Sim", "Não"],
      ),
    );
  }

  console.log(`Created ${created.length} test bets:`);
  for (const bet of created) {
    console.log(
      `  #${bet.id} [${bet.status}] ${bet.title} (${bet.category.title}) — closes ${bet.closesAt?.toISOString()}`,
    );
  }
}

main()
  .catch((error) => {
    console.error("Failed to add test bets:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
