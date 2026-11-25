import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;

  await prisma.leadCounter.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, value: 0 },
  });

  if (!email || !password) {
    console.log("ADMIN_EMAIL/ADMIN_PASSWORD не заданы — сид админа пропущен.");
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Админ уже существует: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      isAdmin: true,
      isActive: true,
    },
  });

  console.log(`Админ создан: ${email}`);
  console.log("После первого деплоя удалите ADMIN_PASSWORD из переменных окружения.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
