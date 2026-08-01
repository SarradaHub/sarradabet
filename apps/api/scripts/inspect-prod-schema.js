const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DIRECT_URL } },
  });

  const types = await prisma.$queryRaw`
    SELECT typname
    FROM pg_type
    WHERE typname IN ('CoinTransactionSource', 'BetStatus', 'VoteStatus')
  `;
  console.log("types:", types);

  const tables = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('coin_packages', 'users', 'bets', 'votes')
    ORDER BY table_name
  `;
  console.log("tables:", tables);

  const cols = await prisma.$queryRaw`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'bets'
    ORDER BY column_name
  `;
  console.log(
    "bets columns:",
    cols.map((c) => c.column_name),
  );

  const allTables = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;
  console.log(
    "all tables:",
    allTables.map((t) => t.table_name),
  );

  const indexes = await prisma.$queryRaw`
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname LIKE 'bets_%'
    ORDER BY indexname
  `;
  console.log(
    "bets indexes:",
    indexes.map((i) => i.indexname),
  );

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
