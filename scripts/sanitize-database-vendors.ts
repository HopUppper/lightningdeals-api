import { prisma } from '../server/db';

async function sanitizeDatabase() {
  console.log('--- 1. Sanitizing Plan Taglines ---');
  const creditStarter = await prisma.plan.findUnique({
    where: { id: 'credit_starter' },
  });

  if (creditStarter) {
    console.log('Current credit_starter tagline:', creditStarter.tagline);
    const updatedPlan = await prisma.plan.update({
      where: { id: 'credit_starter' },
      data: {
        tagline: '₹100 = $700 credits (7x value multiplier). Universal access to frontier OpenAI, Gemini, DeepSeek & Claude models.',
      },
    });
    console.log('Updated credit_starter tagline:', updatedPlan.tagline);
  }

  // Check any other plan taglines for OpusMax or ScaleMax
  const allPlans = await prisma.plan.findMany();
  for (const p of allPlans) {
    if (/OpusMax|ScaleMax|opusmax|scalemax/i.test(p.tagline || '')) {
      const cleaned = (p.tagline || '')
        .replace(/ScaleMax/gi, 'Universal Gateway')
        .replace(/OpusMax/gi, 'Claude Engine');
      await prisma.plan.update({
        where: { id: p.id },
        data: { tagline: cleaned },
      });
      console.log(`Updated plan ${p.id} tagline to: ${cleaned}`);
    }
  }

  console.log('\n--- 2. Sanitizing Model Providers ---');
  const modelsToSanitize = await prisma.model.findMany({
    where: {
      provider: { in: ['ScaleMax', 'scalemax', 'OpusMax', 'opusmax'] },
    },
  });

  console.log(`Found ${modelsToSanitize.length} models to sanitize.`);

  for (const m of modelsToSanitize) {
    let newProvider = 'LightningAPI';
    if (m.family === 'openai') newProvider = 'OpenAI';
    else if (m.family === 'gemini') newProvider = 'Google';
    else if (m.family === 'deepseek') newProvider = 'DeepSeek';
    else if (m.family === 'grok') newProvider = 'xAI';
    else if (m.family === 'qwen') newProvider = 'Alibaba Cloud';
    else if (m.family === 'claude') newProvider = 'Anthropic';

    await prisma.model.update({
      where: { modelId: m.modelId },
      data: { provider: newProvider },
    });
    console.log(`Model ${m.modelId} (family: ${m.family}) provider updated: ${m.provider} -> ${newProvider}`);
  }

  console.log('\n--- 3. Verification ---');
  const remainingLeakedModels = await prisma.model.findMany({
    where: {
      provider: { in: ['ScaleMax', 'scalemax', 'OpusMax', 'opusmax'] },
    },
  });
  console.log('Remaining models with vendor names in provider field:', remainingLeakedModels.length);

  const verifiedPlans = await prisma.plan.findMany();
  const leakedPlans = verifiedPlans.filter((p) => /OpusMax|ScaleMax|opusmax|scalemax/i.test(p.tagline || ''));
  console.log('Remaining plans with vendor names in tagline:', leakedPlans.length);
}

sanitizeDatabase()
  .then(() => {
    console.log('Database sanitization completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Database sanitization failed:', err);
    process.exit(1);
  });
