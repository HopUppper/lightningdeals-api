import { KnowledgeService } from '../server/whatsapp/ai/knowledgeService';
import { prisma } from '../server/db';

async function main() {
  console.log('Seeding Master Business Knowledge Articles and Training Examples...');
  await KnowledgeService.seedDefaultsIfNeeded(true);

  const kCount = await prisma.aIKnowledge.count();
  const tCount = await prisma.aITrainingExample.count();

  console.log(`✅ Success! Seeded Knowledge Articles: ${kCount} | Training Examples: ${tCount}`);

  // Test RAG Retrieval across key scenarios
  const testQueries = [
    'How does activation for Canva Pro work?',
    'how can i earn credits in rewards program',
    'how does referral work',
    'my api is giving 401 error',
    'how do i create an api key on the portal',
    'canva 499 rate',
  ];

  console.log('\n--- RAG RETRIEVAL VERIFICATION ---');
  for (const q of testQueries) {
    const results = await KnowledgeService.searchKnowledge(q, undefined, 2);
    console.log(`\nQuery: "${q}"`);
    for (const r of results) {
      console.log(`  -> [${r.category}] ${r.title} (Priority: ${r.priority})`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
