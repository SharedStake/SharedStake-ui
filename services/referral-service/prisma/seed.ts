import "dotenv/config";
import { PrismaClient, CodeStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.referralCode.upsert({
    where: { code: "GENESIS01" },
    update: {},
    create: {
      code: "GENESIS01",
      referrerAddress: "0x000000000000000000000000000000000000dEaD",
      createdBy: "seed",
      status: CodeStatus.ACTIVE,
      metadata: {
        label: "Example code for local smoke tests"
      }
    }
  });

  await prisma.referralCode.upsert({
    where: { code: "FOUNDER02" },
    update: {},
    create: {
      code: "FOUNDER02",
      referrerAddress: "0x0000000000000000000000000000000000000001",
      createdBy: "seed",
      status: CodeStatus.ACTIVE,
      metadata: {
        label: "Second example mapping"
      }
    }
  });

  console.log("Seed complete.");
}

main()
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
