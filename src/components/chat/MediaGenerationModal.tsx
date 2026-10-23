import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Video,
  Sparkles,
  X,
  AlertTriangle,
  Download,
  Copy,
  Check,
  Code,
  Loader2,
  RefreshCw,
  ExternalLink,
  Info,
} from 'lucide-react';

export interface MediaGenerationModalProps {
  open: boolean;
  onClose: () => void;
  isDarkTheme?: boolean;
  onGenerateSvgInCanvas?: (prompt: string) => void;
  conversationId?: string;
}

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 Square', dims: '1024 × 1024', desc: 'Avatars & cards' },
  { id: '16:9', label: '16:9 Landscape', dims: '1280 × 720', desc: 'Banners & headers' },
  { id: '9:16', label: '9:16 Portrait', dims: '720 × 1280', desc: 'Stories & mobile' },
  { id: '4:3', label: '4:3 Standard', dims: '1024 × 768', desc: 'Editorial' },
];

const STYLE_PRESETS = [
  { id: 'photo', name: 'Photorealistic', desc: 'Natural lighting, 35mm lens, depth of field' },
  { id: 'vector', name: 'Vector Minimalist', desc: 'Clean paths, flat colors, SVG aesthetic' },
  { id: '3d', name: 'Cinematic 3D', desc: 'Octane render, volumetric studio lighting' },
  { id: 'illustration', name: 'Digital Art', desc: 'Modern concept art, expressive palette' },
  { id: 'blueprint', name: 'Technical Blueprint', desc: 'CAD schematics, isometric wireframes' },
];

export const MediaGenerationModal: React.FC<MediaGenerationModalProps> = ({
  open,
  onClose,
  isDarkTheme = false,
  onGenerateSvgInCanvas,
  conversationId,
}) => {
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
  const [prompt, setPrompt] = useState('Futuristic server rack in a sleek data center with subtle violet neon routing');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3'>('16:9');
  const [selectedStyle, setSelectedStyle] = useState('3d');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<{
    id: string;
    url: string;
    downloadUrl: string;
    provider: string;
    dimensions: string;
    prompt: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!open) return null;

  const handleCopyPrompt = () => {
    const fullDirective = `${prompt} --ar ${aspectRatio} --style ${selectedStyle}`;
    navigator.clipboard.writeText(fullDirective);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateSvg = () => {
    if (onGenerateSvgInCanvas) {
      onGenerateSvgInCanvas(prompt);
      onClose();
    }
  };

  const handleSynthesizeImage = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/user/studio/media/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio,
          stylePreset: selectedStyle,
          conversationId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to synthesize image.');
      }

      setGeneratedImage({
        id: data.image.id,
        url: data.image.imageUrl,
        downloadUrl: data.image.downloadUrl,
        provider: data.image.provider,
        dimensions: `${data.image.width} × ${data.image.height}`,
        prompt: data.image.prompt,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Image synthesis failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className={`w-full max-w-2xl max-h-[92vh] rounded-3xl border shadow-2xl overflow-hidden flex flex-col ${
          isDarkTheme
            ? 'bg-[#141C30] border-[#28334B] text-[#F3F5FC]'
            : 'bg-white border-[#E9E4DD] text-[#171717]'
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
            isDarkTheme ? 'border-[#28334B] bg-[#0E1425]/60' : 'border-[#E9E4DD] bg-[#FAF8F5]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
              {activeTab === 'image' ? <ImageIcon className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold tracking-tight">
                  {activeTab === 'image' ? 'Image Synthesis Studio' : 'Video Generation Feasibility'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 dark:bg-violet-950/60 text-violet-800 dark:text-violet-300 border border-violet-300 dark:border-violet-800">
                  Multimodal Phase 3
                </span>
              </div>
              <p className={`text-xs ${isDarkTheme ? 'text-[#A5B0C7]' : 'text-[#625F5A]'}`}>
                {activeTab === 'image'
                  ? 'Synthesize images via verified open-source Flux diffusion or DALL-E engine.'
                  : 'Hardware constraints, commercial pricing, and technical viability assessment.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
              isDarkTheme
                ? 'border-[#28334B] hover:bg-[#19233A] text-[#A5B0C7]'
                : 'border-[#E9E4DD] hover:bg-[#F5F2EE] text-[#625F5A]'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div
          className={`px-6 py-2 border-b flex items-center gap-2 shrink-0 ${
            isDarkTheme ? 'border-[#28334B] bg-[#0E1425]/30' : 'border-[#E9E4DD] bg-[#FAF8F5]/50'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'image'
                ? 'bg-violet-600 text-white shadow-xs'
                : isDarkTheme
                ? 'text-[#A5B0C7] hover:text-[#F3F5FC]'
                : 'text-[#625F5A] hover:text-[#171717]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Image Generation</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'video'
                ? 'bg-violet-600 text-white shadow-xs'
                : isDarkTheme
                ? 'text-[#A5B0C7] hover:text-[#F3F5FC]'
                : 'text-[#625F5A] hover:text-[#171717]'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Video Feasibility Assessment</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {activeTab === 'image' ? (
            <>
              {/* Generated Image Preview Card */}
              {generatedImage && (
                <div
                  className={`p-4 rounded-2xl border space-y-3 ${
                    isDarkTheme ? 'bg-[#0E1425] border-[#28334B]' : 'bg-[#FAF8F5] border-[#E9E4DD]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 dark:bg-green-950/60 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-800">
                        {generatedImage.provider}
                      </span>
                      <span className="text-xs font-mono opacity-60">{generatedImage.dimensions}</span>
                    </div>

                    <a
                      href={generatedImage.downloadUrl}
                      download={`lightningapi_image_${generatedImage.id}.jpg`}
                      className="px-3 py-1 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Image</span>
                    </a>
                  </div>

                  <div className="rounded-xl overflow-hidden border border-black/10 dark:border-white/10 max-h-80 flex items-center justify-center bg-black/5 dark:bg-black/20">
                    <img
                      src={generatedImage.url}
                      alt={generatedImage.prompt}
                      className="w-full h-auto max-h-80 object-contain rounded-xl"
                    />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Prompt Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider block opacity-75">
                    Creative Visual Prompt
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="text-xs font-medium text-violet-500 hover:text-violet-600 flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Prompt'}</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the visual scene, subject, lighting, framing, and mood..."
                  className={`w-full p-3.5 rounded-2xl text-xs sm:text-sm border focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium resize-none ${
                    isDarkTheme
                      ? 'bg-[#0E1425] border-[#28334B] text-[#F3F5FC]'
                      : 'bg-[#FAF8F5] border-[#E9E4DD] text-[#171717]'
                  }`}
                />
              </div>

              {/* Aspect Ratio Picker */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider block opacity-75">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ASPECT_RATIOS.map((ar) => {
                    const isSelected = aspectRatio === ar.id;
                    return (
                      <button
                        key={ar.id}
                        type="button"
                        onClick={() => setAspectRatio(ar.id as any)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/40 shadow-xs'
                            : isDarkTheme
                            ? 'border-[#28334B] bg-[#0E1425]/40 hover:border-violet-500/40'
                            : 'border-[#E9E4DD] bg-[#FAF8F5] hover:border-violet-500/40'
                        }`}
                      >
                        <p className="font-bold text-xs">{ar.label}</p>
                        <p className="text-[10px] font-mono opacity-60">{ar.dims}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Style Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider block opacity-75">
                  Visual Aesthetic Preset
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {STYLE_PRESETS.map((st) => {
                    const isSelected = selectedStyle === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setSelectedStyle(st.id)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/40 shadow-xs'
                            : isDarkTheme
                            ? 'border-[#28334B] bg-[#0E1425]/40 hover:border-violet-500/40'
                            : 'border-[#E9E4DD] bg-[#FAF8F5] hover:border-violet-500/40'
                        }`}
                      >
                        <p className="font-bold text-xs">{st.name}</p>
                        <p className="text-[10px] opacity-70 leading-relaxed">{st.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Video Feasibility Assessment Tab */
            <div className="space-y-4">
              <div
                className={`p-4 rounded-2xl border space-y-2 ${
                  isDarkTheme
                    ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs">Video Generation Deferred — Assessment Report</h4>
                    <p className="text-xs opacity-90 leading-relaxed mt-1">
                      Per Phase 3 specifications, we do not deploy fake video mockups. Zero-cost or open-source video generation is not technically feasible on standard server hardware without enterprise GPU infrastructure.
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`p-4 rounded-2xl border space-y-3 ${
                  isDarkTheme ? 'bg-[#0E1425] border-[#28334B]' : 'bg-[#FAF8F5] border-[#E9E4DD]'
                }`}
              >
                <div className="space-y-1">
                  <p className="text-xs font-bold text-violet-600 dark:text-violet-400">1. Hardware & Self-Hosting Requirements</p>
                  <p className="text-xs opacity-80 leading-relaxed">
                    Open-source models (Stable Video Diffusion, CogVideoX) require a minimum of 24GB-80GB VRAM (NVIDIA A10G or A100 GPU instances) costing $1.50 to $3.50 per hour. CPU inference requires 45+ minutes per 4-second clip, rendering it unsuitable for interactive chat.
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-violet-600 dark:text-violet-400">2. Commercial Provider Pricing</p>
                  <p className="text-xs opacity-80 leading-relaxed">
                    Commercial providers (Runway Gen-3, Luma Dream Machine, Kling AI) offer no permanent free tier. Commercial API access starts at $0.25 to $0.60 per 5-second generation with minimum monthly commitments.
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-violet-600 dark:text-violet-400">3. Operational Recommendation</p>
                  <p className="text-xs opacity-80 leading-relaxed">
                    Video generation is deferred until dedicated GPU infrastructure is provisioned or customer-paid video add-ons are authorized. Image synthesis and interactive SVG canvas graphics remain fully operational.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-4 border-t flex items-center justify-between shrink-0 ${
            isDarkTheme ? 'border-[#28334B] bg-[#0E1425]/60' : 'border-[#E9E4DD] bg-[#FAF8F5]'
          }`}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGenerateSvg}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDarkTheme
                  ? 'border-[#28334B] hover:bg-[#19233A] text-[#A5B0C7]'
                  : 'border-[#E9E4DD] hover:bg-[#F5F2EE] text-[#625F5A]'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Vector SVG in Canvas</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${
                isDarkTheme
                  ? 'border-[#28334B] text-[#A5B0C7] hover:bg-[#19233A]'
                  : 'border-[#E9E4DD] text-[#625F5A] hover:bg-[#F5F2EE]'
              }`}
            >
              Close
            </button>

            {activeTab === 'image' && (
              <button
                type="button"
                onClick={handleSynthesizeImage}
                disabled={isGenerating || !prompt.trim()}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white flex items-center gap-2 cursor-pointer shadow-md shadow-violet-600/20 transition-all"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{isGenerating ? 'Synthesizing...' : 'Synthesize Image'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
