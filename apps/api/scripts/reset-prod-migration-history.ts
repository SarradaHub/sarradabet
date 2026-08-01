import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DIRECT_URL } },
  });

  const deleted = await prisma.$executeRawUnsafe(
    'DELETE FROM "_prisma_migrations"',
  );
  console.log(`Deleted ${deleted} migration history row(s).`);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
