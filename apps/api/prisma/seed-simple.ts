import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "../src/utils/auth";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hashPassword("user123");
  const adminPasswordHash = await hashPassword("admin123");

  await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@sarradabet.com",
      phone: "5511999990001",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      coinBalance: 0,
    },
  });

  await prisma.user.create({
    data: {
      username: "user",
      email: "user@sarradabet.com",
      phone: "5511999990002",
      passwordHash,
      role: UserRole.USER,
      coinBalance: 0,
    },
  });

  console.log("Simple seed completed: admin + user accounts created");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
