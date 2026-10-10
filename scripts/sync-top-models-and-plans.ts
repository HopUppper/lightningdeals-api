import { prisma } from '../server/db';

async function syncTopModelsAndPlans() {
  console.log('⚡ [SYNC] Updating models and plans in PostgreSQL...');

  // 1. Remove/disable old models
  await prisma.model.deleteMany({
    where: {
      modelId: {
        in: [
          'claude-3-5-sonnet-20241022',
          'claude-3-opus-20240229',
          'claude-3-5-haiku-20241022',
          'claude-3-7-sonnet-20250219',
          'claude-haiku-4.5',
          'claude-haiku-4-5',
        ],
      },
    },
  });

  // 2. Define the Top 10 Latest Claude Models
  const topModels = [
    {
      modelId: 'claude-opus-5.5',
      displayName: 'Claude Opus 5.5',
      provider: 'Anthropic',
      description: 'Pinnacle frontier intelligence model for ultra-complex architectural proofs and deep autonomous systems design.',
      contextWindow: 1000000,
      inputPrice: 15.0,
      outputPrice: 75.0,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
      enabled: true,
    },
    {
      modelId: 'claude-sonnet-5.5',
      displayName: 'Claude Sonnet 5.5',
      provider: 'Anthropic',
      description: 'Next-generation flagship coding workhorse engineered for Cursor, Windsurf, and Claude Code CLI with unprecedented multi-file refactoring precision.',
      contextWindow: 1000000,
      inputPrice: 3.0,
      outputPrice: 15.0,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
      enabled: true,
    },
    {
      modelId: 'claude-opus-5',
      displayName: 'Claude Opus 5',
      provider: 'Anthropic',
      description: 'Massive cognitive depth for exhaustive problem solving, complex enterprise systems, and rigorous mathematical analysis.',
      contextWindow: 1000000,
      inputPrice: 15.0,
      outputPrice: 75.0,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
      enabled: true,
    },
    {
      modelId: 'claude-sonnet-5',
      displayName: 'Claude Sonnet 5',
      provider: 'Anthropic',
      description: 'High-performance engineering workhorse combining fast generation velocity with deep software synthesis.',
      contextWindow: 1000000,
      inputPrice: 3.0,
      outputPrice: 15.0,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
      enabled: true,
    },
    {
      modelId: 'claude-fable-5',
      displayName: 'Claude Fable 5',
      provider: 'Anthropic',
      description: 'Ultra-fast response model optimized for real-time IDE completion, inline diff generation, and rapid developer interaction loops.',
      contextWindow: 1000000,
      inputPrice: 0.8,
      outputPrice: 4.0,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
      enabled: true,
    },
    {
      modelId: 'claude-fable-5-flash',
      displayName: 'Claude Fable 5 Flash',
      provider: 'Anthropic',
      description: 'Ultra-lightweight, blazing-fast execution model tailored for automated CI/CD triage, linting engines, and continuous background loops.',
      contextWindow: 500000,
      inputPrice: 0.4,
      outputPrice: 2.0,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
      enabled: true,
    },
    {
      modelId: 'claude-opus-5-thinking',
      displayName: 'Claude Opus 5 Extended Thinking',
      provider: 'Anthropic',
      description: 'Deep reflective reasoning engine featuring explicit internal thought buffers for auditing intricate edge-case bugs and compiler invariants.',
      contextWindow: 1000000,
      inputPrice: 15.0,
      outputPrice: 75.0,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
      enabled: true,
    },
    {
      modelId: 'claude-sonnet-5-thinking',
      displayName: 'Claude Sonnet 5 Extended Thinking',
      provider: 'Anthropic',
      description: 'Extended deliberation architecture designed for complex algorithm synthesis, security audits, and difficult system debugging.',
      contextWindow: 1000000,
      inputPrice: 3.0,
      outputPrice: 15.0,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
      enabled: true,
    },
    {
      modelId: 'claude-haiku-5.5',
      displayName: 'Claude Haiku 5.5',
      provider: 'Anthropic',
      description: 'Next-gen high-velocity model delivering instant streaming completions for high-traffic developer tools and responsive workflows.',
      contextWindow: 500000,
      inputPrice: 0.5,
      outputPrice: 2.5,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
      enabled: true,
    },
    {
      modelId: 'claude-haiku-5',
      displayName: 'Claude Haiku 5',
      provider: 'Anthropic',
      description: 'Compact and efficient execution model for high-frequency token streaming, automated test generation, and classification pipelines.',
      contextWindow: 500000,
      inputPrice: 0.4,
      outputPrice: 2.0,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
      enabled: true,
    },
  ];

  for (const model of topModels) {
    const existing = await prisma.model.findFirst({ where: { modelId: model.modelId } });
    if (existing) {
      await prisma.model.update({
        where: { id: existing.id },
        data: model,
      });
    } else {
      await prisma.model.create({
        data: model,
      });
    }
  }
  console.log(`✓ Synchronized ${topModels.length} Top Claude Models.`);

  // 3. Remove old legacy TokenPackage rows to prevent duplicate/stale plans
  await prisma.tokenPackage.deleteMany({});
  console.log('✓ Purged legacy tokenPackage table.');

  // 4. Update features in the active plans to only mention the latest models
  const proPlan = await prisma.plan.findFirst({ where: { id: 'pro' } });
  if (proPlan) {
    await prisma.plan.update({
      where: { id: 'pro' },
      data: {
        tagline: 'High-performance access for active daily coding assistance with Sonnet 5.5 & Sonnet 5',
        featuresJson: JSON.stringify([
          '5,000,000 Tokens / 5h Window',
          '30-Day Fixed Validity',
          'Claude Sonnet 5.5, Sonnet 5 & Haiku 5.5 Access',
          'Sub-35ms Gateway Routing',
          'Instant Automated Delivery',
        ]),
      },
    });
  }

  const maxPlan = await prisma.plan.findFirst({ where: { id: 'max' } });
  if (maxPlan) {
    await prisma.plan.update({
      where: { id: 'max' },
      data: {
        tagline: 'Best value for heavy IDE power users & builders with Opus 5.5, Fable 5 & Sonnet 5.5',
        featuresJson: JSON.stringify([
          '20,000,000 Tokens / 5h Window',
          '30-Day Fixed Validity',
          'Claude Opus 5.5, Fable 5, Sonnet 5.5 & Thinking Models',
          'Cursor, Windsurf & CLI Ready',
          'Instant Automated Delivery',
        ]),
      },
    });
  }

  const ultraPlan = await prisma.plan.findFirst({ where: { id: 'ultra' } });
  if (ultraPlan) {
    await prisma.plan.update({
      where: { id: 'ultra' },
      data: {
        tagline: 'Maximum high-volume capacity for engineering teams with all Top 10 Claude Models',
        featuresJson: JSON.stringify([
          '40,000,000 Tokens / 5h Window',
          '30-Day Fixed Validity',
          'Max Concurrency & Priority Throughput',
          'All Top 10 Claude Models with 1M Context Window',
          'VIP Direct Engineering Support',
        ]),
      },
    });
  }

  const testPlan = await prisma.plan.findFirst({ where: { slug: 'test_plan' } });
  if (testPlan) {
    await prisma.plan.update({
      where: { id: testPlan.id },
      data: {
        tagline: 'Test evaluation capacity tier',
        featuresJson: JSON.stringify([
          '1,000 Tokens / 5h Window',
          '30-Day Fixed Validity',
          'Claude Sonnet 5.5 & Haiku 5.5 Access',
        ]),
      },
    });
  }

  console.log('✓ Successfully updated plan features to latest models.');

  const allActivePlans = await prisma.plan.findMany({ where: { enabled: true }, orderBy: { sortOrder: 'asc' } });
  console.log('ACTIVE PLANS NOW IN DB:', allActivePlans.map((p) => ({ id: p.id, name: p.name, price: p.priceInr })));

  const allActiveModels = await prisma.model.findMany({ where: { enabled: true } });
  console.log('ACTIVE MODELS NOW IN DB:', allActiveModels.map((m) => m.displayName));
}

syncTopModelsAndPlans()
  .catch((e) => {
    console.error('Error during sync:', e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
