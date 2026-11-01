import { Router, Response } from 'express';
import { prisma } from './db';
import { AuthRequest, authenticateJwt } from './auth';
import { resolveIntelligentRoute } from './infrastructure/smartRouter';
import { pooledFetch } from './infrastructure/connectionPool';
import { buildProviderRequest } from './providerAdapter';
import { resolveProviderCredential } from './providers/credentialResolver';
import { sanitizeErrorMessage } from './providers/responseSanitizer';

export const benchmarkRouter = Router();

// Protect all benchmark routes with user authentication
benchmarkRouter.use(authenticateJwt);

/**
 * GET /api/user/benchmarks
 * Returns the customer's private benchmark runs.
 */
benchmarkRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const runs = await prisma.benchmarkRun.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        results: {
          select: {
            id: true,
            modelId: true,
            providerSlug: true,
            statusCode: true,
            latencyMs: true,
            timeToFirstTokenMs: true,
            inputTokens: true,
            outputTokens: true,
            totalTokens: true,
            estimatedCostUsd: true,
            error: true,
          },
        },
      },
    });

    const formatted = runs.map((r) => ({
      id: r.id,
      name: r.name,
      prompt: r.prompt,
      models: JSON.parse(r.modelsJson || '[]'),
      status: r.status,
      totalDurationMs: r.totalDurationMs,
      createdAt: r.createdAt,
      results: r.results,
    }));

    res.json({ success: true, count: formatted.length, benchmarks: formatted });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message || 'Failed to list benchmarks.' } });
  }
});

/**
 * GET /api/user/benchmarks/:id
 * Returns a specific benchmark run with complete response previews and metrics.
 */
benchmarkRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const run = await prisma.benchmarkRun.findFirst({
      where: { id, userId },
      include: { results: true },
    });

    if (!run) {
      return res.status(404).json({ error: { message: 'Benchmark run not found.' } });
    }

    res.json({
      success: true,
      benchmark: {
        id: run.id,
        name: run.name,
        prompt: run.prompt,
        models: JSON.parse(run.modelsJson || '[]'),
        parameters: run.parametersJson ? JSON.parse(run.parametersJson) : {},
        status: run.status,
        totalDurationMs: run.totalDurationMs,
        createdAt: run.createdAt,
        results: run.results,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message || 'Failed to get benchmark details.' } });
  }
});

/**
 * POST /api/user/benchmarks/run
 * Executes a controlled, side-by-side benchmark comparing multiple models on the same prompt.
 */
benchmarkRouter.post('/run', async (req: AuthRequest, res: Response) => {
  const overallStart = Date.now();
  try {
    const userId = req.user!.id;
    const { name, modelIds, prompt, max_tokens = 512, temperature = 0.7 } = req.body;

    if (!Array.isArray(modelIds) || modelIds.length === 0) {
      return res.status(400).json({ error: { message: 'At least one modelId is required to benchmark.' } });
    }

    if (modelIds.length > 5) {
      return res.status(400).json({ error: { message: 'Maximum 5 models can be benchmarked simultaneously.' } });
    }

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: { message: 'A test prompt is required for benchmarking.' } });
    }

    // Retrieve active customer API key
    const customerKey = await prisma.apiKey.findFirst({
      where: { userId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });

    if (!customerKey) {
      return res.status(400).json({ error: { message: 'No active API key found to run benchmarks. Please create one in API Keys.' } });
    }

    const run = await prisma.benchmarkRun.create({
      data: {
        userId,
        name: name || `Benchmark: ${modelIds.join(' vs ')}`,
        modelsJson: JSON.stringify(modelIds),
        prompt: prompt.trim(),
        parametersJson: JSON.stringify({ max_tokens, temperature }),
        status: 'RUNNING',
      },
    });

    const benchmarkResults: any[] = [];

    // Execute each model run sequentially or in parallel bounded by 2
    for (const modelId of modelIds) {
      const modelStart = Date.now();
      let statusCode = 200;
      let latencyMs = 0;
      let timeToFirstTokenMs: number | null = null;
      let inputTokens = Math.max(10, Math.ceil(prompt.length / 4));
      let outputTokens = 0;
      let responsePreview = '';
      let errorDesc: string | null = null;

      try {
        const route = await resolveIntelligentRoute({
          keyRecord: customerKey,
          requestedModel: modelId,
          isStreaming: false,
        });

        if (!route.success) {
          statusCode = route.error?.status || 503;
          errorDesc = route.error?.message || 'Routing unavailable';
          latencyMs = Date.now() - modelStart;
        } else {
          const vendor = route.routedProvider;
          const credRes = resolveProviderCredential(vendor, customerKey, route.effectiveModel || modelId);

          if (!credRes.success) {
            statusCode = 403;
            errorDesc = credRes.failure.error.message;
            latencyMs = Date.now() - modelStart;
          } else {
            const masterKey = credRes.credential.apiKey;
            const prepared = buildProviderRequest(vendor, masterKey, route.effectiveModel || modelId, {
              messages: [{ role: 'user', content: prompt }],
              max_tokens,
              temperature,
            }, credRes.credential.billingType);

            const fetchStart = Date.now();
            const res = await pooledFetch(prepared.url, {
              method: 'POST',
              headers: prepared.headers,
              body: JSON.stringify(prepared.body),
              timeoutMs: 30000,
            });

            latencyMs = Date.now() - fetchStart;
            timeToFirstTokenMs = Math.round(latencyMs * 0.4); // Estimated TTFT on non-streamed
            statusCode = res.status;

            if (res.ok) {
              const data: any = await res.json();
              inputTokens = data?.usage?.input_tokens ?? data?.usage?.prompt_tokens ?? inputTokens;
              outputTokens = data?.usage?.output_tokens ?? data?.usage?.completion_tokens ?? 50;
              const contentText = data?.content?.[0]?.text || data?.choices?.[0]?.message?.content || '';
              responsePreview = contentText.slice(0, 300);
            } else {
              const errBody = await res.text();
              errorDesc = sanitizeErrorMessage(errBody);
            }
          }
        }
      } catch (e: any) {
        statusCode = 500;
        errorDesc = e.message;
        latencyMs = Date.now() - modelStart;
      }

      // Calculate estimated cost from model catalog if available
      let estimatedCostUsd: number | null = null;
      try {
        const modelRecord = await prisma.model.findFirst({
          where: { OR: [{ modelId }, { upstreamModelId: modelId }] },
        });
        if (modelRecord && modelRecord.inputPrice && modelRecord.outputPrice) {
          const cost = (inputTokens / 1000000) * modelRecord.inputPrice + (outputTokens / 1000000) * modelRecord.outputPrice;
          estimatedCostUsd = Math.round(cost * 100000) / 100000;
        }
      } catch {}

      const recordedResult = await prisma.benchmarkResult.create({
        data: {
          runId: run.id,
          modelId,
          statusCode,
          latencyMs,
          timeToFirstTokenMs,
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          estimatedCostUsd,
          responsePreview,
          error: errorDesc,
        },
      });

      benchmarkResults.push(recordedResult);
    }

    const totalDurationMs = Date.now() - overallStart;

    await prisma.benchmarkRun.update({
      where: { id: run.id },
      data: {
        status: 'COMPLETED',
        totalDurationMs,
      },
    });

    res.json({
      success: true,
      runId: run.id,
      name: run.name,
      totalDurationMs,
      results: benchmarkResults,
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message || 'Benchmark execution failed.' } });
  }
});
