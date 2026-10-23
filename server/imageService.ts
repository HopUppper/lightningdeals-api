/**
 * server/imageService.ts
 *
 * Multimodal Image Generation & Video Assessment Service for LightningAPI AI Chat Studio.
 *
 * Principles:
 * 1. Working functionality over mockups.
 * 2. Uses verified open-source hosted provider (Pollinations.ai Flux Engine) with zero credit card requirements.
 * 3. Supports DALL-E 3 fallback if OPENAI_API_KEY is configured.
 * 4. Saves generated images to user's secure artifact store for authorized downloads.
 * 5. Video generation: Honest technical assessment deferral (no fake generation).
 */

import { saveArtifact, getArtifactById } from './documentGenerator';
import crypto from 'crypto';

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3';

export interface ImageGenerationOptions {
  userId: string;
  conversationId?: string;
  prompt: string;
  aspectRatio?: AspectRatio;
  stylePreset?: string;
  seed?: number;
}

export interface GeneratedImageResult {
  id: string;
  artifactId: string;
  prompt: string;
  aspectRatio: AspectRatio;
  width: number;
  height: number;
  provider: string;
  imageUrl: string;
  downloadUrl: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface VideoAssessmentReport {
  status: 'deferred';
  reason: string;
  hardwareRequirements: string;
  commercialApiCosts: string;
  latencyAndLimits: string;
  recommendation: string;
}

const ASPECT_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  '1:1': { width: 1024, height: 1024 },
  '16:9': { width: 1280, height: 720 },
  '9:16': { width: 720, height: 1280 },
  '4:3': { width: 1024, height: 768 },
};

const STYLE_ENHANCERS: Record<string, string> = {
  photo: 'photorealistic, 35mm photography, natural lighting, highly detailed',
  vector: 'vector graphic, minimalist clean lines, flat colors, svg aesthetic',
  '3d': 'cinematic 3d render, octane render, volumetric studio lighting, high resolution',
  illustration: 'digital illustration, modern concept art, vibrant artistic palette',
  blueprint: 'technical blueprint, CAD isometric schematic, architectural drawing',
};

/**
 * Synthesizes an image from a natural language prompt and persists to user's artifact storage.
 */
export async function generateStudioImage(
  options: ImageGenerationOptions
): Promise<GeneratedImageResult> {
  const { userId, conversationId, prompt, aspectRatio = '1:1', stylePreset, seed } = options;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    throw new Error('Image generation prompt is required.');
  }

  const dims = ASPECT_DIMENSIONS[aspectRatio] || ASPECT_DIMENSIONS['1:1'];
  const enhancer = stylePreset && STYLE_ENHANCERS[stylePreset] ? STYLE_ENHANCERS[stylePreset] : '';
  const enhancedPrompt = enhancer ? `${prompt.trim()}, ${enhancer}` : prompt.trim();
  const effectiveSeed = seed || Math.floor(Math.random() * 1000000);

  // Check if OpenAI DALL-E is configured
  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  if (openAiKey && process.env.ENABLE_DALLE_IMAGE_GEN === 'true') {
    try {
      const resp = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: enhancedPrompt,
          n: 1,
          size: aspectRatio === '16:9' ? '1792x1024' : '1024x1024',
          response_format: 'b64_json',
        }),
      });

      if (resp.ok) {
        const data: any = await resp.json();
        const b64 = data.data?.[0]?.b64_json;
        if (b64) {
          const buffer = Buffer.from(b64, 'base64');
          const filename = `image_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.png`;
          const artifact = saveArtifact({
            userId,
            conversationId,
            title: `Generated Image: ${prompt.trim().substring(0, 30)}`,
            format: 'docx' as any,
            filename,
            mimeType: 'image/png',
            sizeBytes: buffer.length,
            buffer,
          });

          return {
            id: artifact.id,
            artifactId: artifact.id,
            prompt: enhancedPrompt,
            aspectRatio,
            width: dims.width,
            height: dims.height,
            provider: 'OpenAI DALL-E 3',
            imageUrl: `/api/user/studio/artifacts/${artifact.id}/download`,
            downloadUrl: `/api/user/studio/artifacts/${artifact.id}/download`,
            mimeType: 'image/png',
            sizeBytes: buffer.length,
            createdAt: artifact.createdAt,
          };
        }
      }
    } catch {
      // Fall through to open-source engine
    }
  }

  // Open-Source Hosted Flux Engine (Pollinations.ai)
  // Direct, high-fidelity diffusion with zero subscription requirements
  const encoded = encodeURIComponent(enhancedPrompt);
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encoded}?width=${dims.width}&height=${dims.height}&model=flux&seed=${effectiveSeed}&nologo=true`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 18000);

  let imageBuffer: Buffer;
  try {
    const res = await fetch(pollinationsUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'LightningAPI-Studio/3.0' },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Upstream image synthesis returned HTTP ${res.status}`);
    }

    const arrayBuf = await res.arrayBuffer();
    imageBuffer = Buffer.from(arrayBuf);
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw new Error(`Image synthesis failed: ${err.message || 'Connection timeout'}. Please try again.`);
  }

  const filename = `synth_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.jpg`;
  const artifact = saveArtifact({
    userId,
    conversationId,
    title: `Image: ${prompt.trim().substring(0, 30)}`,
    format: 'docx' as any,
    filename,
    mimeType: 'image/jpeg',
    sizeBytes: imageBuffer.length,
    buffer: imageBuffer,
  });

  return {
    id: artifact.id,
    artifactId: artifact.id,
    prompt: enhancedPrompt,
    aspectRatio,
    width: dims.width,
    height: dims.height,
    provider: 'Pollinations Flux (Open-Source)',
    imageUrl: `/api/user/studio/artifacts/${artifact.id}/download`,
    downloadUrl: `/api/user/studio/artifacts/${artifact.id}/download`,
    mimeType: 'image/jpeg',
    sizeBytes: imageBuffer.length,
    createdAt: artifact.createdAt,
  };
}

/**
 * Honest, authoritative assessment of Video Generation feasibility.
 */
export function getTechnicalVideoAssessment(): VideoAssessmentReport {
  return {
    status: 'deferred',
    reason: 'Zero-cost or open-source video generation is not technically viable without dedicated GPU clusters.',
    hardwareRequirements:
      'Self-hosting models like Stable Video Diffusion (SVD) or CogVideoX requires at least 24GB-80GB VRAM (NVIDIA A10G or A100) at $1.50-$3.50/hour. Running on CPU requires 45+ minutes per 4-second clip.',
    commercialApiCosts:
      'Commercial APIs (Runway Gen-3 Alpha, Luma Dream Machine, Kling AI, Pika) lack permanent free API tiers and charge $0.25 to $0.60 per 5-second generation with strict monthly billing commitments.',
    latencyAndLimits:
      'Video synthesis incurs 45s-180s latency per request, exceeding synchronous HTTP/SSE server timeouts and requiring asynchronous worker queues, S3 storage buckets, and CDN streaming egress.',
    recommendation:
      'Video generation is deferred until dedicated enterprise GPU credits or customer-paid video add-ons are authorized. No fake video mockup is rendered.',
  };
}
