import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const priority = [
  'claude-opus-5.5',
  'claude-sonnet-5.5',
  'claude-opus-5',
  'claude-sonnet-5',
  'claude-fable-5',
  'claude-fable-5-flash',
  'claude-opus-5-thinking',
  'claude-sonnet-5-thinking',
  'claude-haiku-5.5',
  'claude-haiku-5',
];

async function main() {
  const deleted = await prisma.model.deleteMany({
    where: {
      modelId: { notIn: priority },
    },
  });
  console.log('Deleted legacy models count:', deleted.count);
  const remaining = await prisma.model.findMany();
  console.log('Remaining models count in database:', remaining.length);
  console.log(remaining.map((m) => m.modelId));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
