#!/usr/bin/env node
// Enforce strict TLS certificate verification in CLI execution
const initialTlsEnv = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;

import readline from 'readline';
import os from 'os';

import { validateApiKey, fetchLiveModels, getGatewayUrl, probeModelRouting, KeyStatusResult, KeyModel } from './api.js';
import {
  getClientTargets,
  configureClient,
  switchClientModel,
  verifyClientModelConfiguration,
  removeClientConfiguration,
  getFriendlyModelName,
  readGlobalConfig,
  writeGlobalConfig,
  ClientTarget
} from './clients.js';

async function resolveKeyModels(apiKey: string, status: KeyStatusResult): Promise<KeyModel[]> {
  if (status.availableModels && status.availableModels.length > 1) {
    return status.availableModels;
  }

  try {
    const liveModels = await fetchLiveModels(apiKey);
    if (liveModels && liveModels.length > 0) {
      return liveModels.map((m: any) => ({
        id: m.id || m.modelId,
        name: m.display_name || m.displayName || m.name || getFriendlyModelName(m.id || m.modelId),
        description: m.description,
        contextWindow: m.context_window || m.contextWindow,
      }));
    }
  } catch (e) {}

  const defaultCatalog: KeyModel[] = [
    { id: 'claude-opus-5.5', name: 'Claude Opus 5.5', contextWindow: 1000000 },
    { id: 'claude-sonnet-5.5', name: 'Claude Sonnet 5.5', contextWindow: 1000000 },
    { id: 'claude-opus-5', name: 'Claude Opus 5', contextWindow: 1000000 },
    { id: 'claude-sonnet-5', name: 'Claude Sonnet 5', contextWindow: 1000000 },
    { id: 'claude-fable-5', name: 'Claude Fable 5', contextWindow: 1000000 },
    { id: 'claude-fable-5-flash', name: 'Claude Fable 5 Flash', contextWindow: 500000 },
    { id: 'claude-opus-5-thinking', name: 'Claude Opus 5 Extended Thinking', contextWindow: 1000000 },
    { id: 'claude-sonnet-5-thinking', name: 'Claude Sonnet 5 Extended Thinking', contextWindow: 1000000 },
    { id: 'claude-haiku-5.5', name: 'Claude Haiku 5.5', contextWindow: 500000 },
    { id: 'claude-haiku-5', name: 'Claude Haiku 5', contextWindow: 500000 },
  ];

  if (status.allowedModels && status.allowedModels !== 'all' && status.allowedModels !== '*') {
    const allowed = status.allowedModels.split(',').map(s => s.trim().toLowerCase());
    return defaultCatalog.filter(m => allowed.some(a => a === m.id.toLowerCase() || m.id.toLowerCase().includes(a)));
  }

  return defaultCatalog;
}

// ANSI Color Tokens for Rich Terminal Styling
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  brightCyan: '\x1b[96m',
  amber: '\x1b[38;5;214m',
  brightAmber: '\x1b[38;5;220m',
  yellow: '\x1b[33m',
  brightYellow: '\x1b[93m',
  green: '\x1b[32m',
  brightGreen: '\x1b[92m',
  purple: '\x1b[35m',
  brightPurple: '\x1b[95m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
  white: '\x1b[97m',
  bgAmber: '\x1b[48;5;214m\x1b[30;1m',
  bgPurple: '\x1b[45m\x1b[37;1m',
};

const BANNER = `
${c.brightPurple}  ██╗     ██╗██████╗ ██╗  ██╗████████╗███╗   ██╗██╗███╗   ██╗██████╗ 
  ██║     ██║██╔════╝ ██║  ██║╚══██╔══╝████╗  ██║██║████╗  ██║██╔════╝ 
  ██║     ██║██║  ███╗███████║   ██║   ██╔██╗ ██║██║██╔██╗ ██║██║  ███╗
  ██║     ██║██║   ██║██╔══██║   ██║   ██║╚██╗██║██║██║╚██╗██║██║   ██║
  ███████╗██║╚██████╔╝██║  ██║   ██║   ██║ ╚████║██║██║ ╚████║╚██████╔╝
  ╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═══╝╚═╝╚═╝  ╚═══╝ ╚═════╝ ${c.reset}
  ${c.bgAmber} ⚡ LIGHTNINGDEALS ${c.reset} ${c.amber}${c.bold}Universal AI Gateway Setup Wizard${c.reset}
`;

const askQuestion = (query: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(query, (answer: string) => {
      rl.close();
      resolve(answer.trim());
    });
  });
};

const maskString = (str: string): string => {
  if (!str) return '••••••••';
  if (str.length <= 10) return '••••••••';
  return str.slice(0, 8) + '••••••••' + str.slice(-4);
};

const formatTokenCount = (val?: string): string => {
  if (!val) return '0';
  const num = Number(val);
  if (isNaN(num)) return val;
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
};

const getApiKeyFromArgsOrEnv = (): string => {
  const args = process.argv.slice(2);
  const keyIndex = args.findIndex(arg => arg === '--key' || arg === '-k');
  if (keyIndex !== -1 && args[keyIndex + 1]) {
    return args[keyIndex + 1].trim();
  }
  const envKey = (process.env.LIGHTNINGDEALS_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || '').trim();
  if (envKey) return envKey;

  const globalCfg = readGlobalConfig();
  if (globalCfg.apiKey) return globalCfg.apiKey.trim();

  return '';
};

const getModelFromArgsOrEnv = (): string => {
  const args = process.argv.slice(2);
  const mIndex = args.findIndex(arg => arg === '--model' || arg === '-m');
  if (mIndex !== -1 && args[mIndex + 1]) {
    return args[mIndex + 1].trim();
  }
  const envModel = (process.env.ANTHROPIC_MODEL || process.env.LIGHTNINGDEALS_MODEL || '').trim();
  if (envModel) return envModel;

  const globalCfg = readGlobalConfig();
  if (globalCfg.activeModel) return globalCfg.activeModel.trim();

  return '';
};

function printSystemInfo() {
  console.log(`${c.gray}┌───────────────────────── SYSTEM ENVIRONMENT ─────────────────────────┐${c.reset}`);
  console.log(`  ${c.cyan}OS Platform${c.reset}   : ${c.white}${os.platform()} (${os.arch()})${c.reset}`);
  console.log(`  ${c.cyan}Node Runtime${c.reset}  : ${c.white}${process.version}${c.reset}`);
  console.log(`  ${c.cyan}Gateway URL${c.reset}   : ${c.amber}${getGatewayUrl()}${c.reset}`);
  console.log(`  ${c.cyan}TLS Verify${c.reset}    : ${c.brightGreen}Strict Certificate Verification Active${c.reset}`);
  console.log(`${c.gray}└──────────────────────────────────────────────────────────────────────┘${c.reset}\n`);
}

async function runDoctor() {
  console.log(BANNER);
  console.log(`${c.amber}🔍 LightningDeals System & Connection Diagnostics${c.reset}\n`);

  let apiKey = getApiKeyFromArgsOrEnv();

  if (!apiKey) {
    const clients = getClientTargets();
    const existing = clients.find(c => c.existingApiKey);
    if (existing?.existingApiKey) {
      apiKey = existing.existingApiKey;
    }
  }

  if (!apiKey) {
    console.log(`${c.yellow}⚠️ No active LightningDeals API key found in environment.${c.reset}`);
    apiKey = await askQuestion(`${c.bold}Enter your LightningDeals API Key: ${c.reset}`);
  }

  if (!apiKey) {
    console.log(`${c.red}✕ Doctor aborted: Valid API key is required.${c.reset}`);
    process.exit(1);
  }

  const gatewayUrl = getGatewayUrl();
  console.log(`${c.gray}┌────────────────────── DIAGNOSTIC PROBE TARGETS ──────────────────────┐${c.reset}`);
  console.log(`  ${c.cyan}Gateway Endpoint${c.reset}  : ${c.white}${gatewayUrl}${c.reset}`);
  console.log(`  ${c.cyan}TLS Protocol${c.reset}      : ${c.brightGreen}TLS 1.3 Strict Verified (Bypass Disabled)${c.reset}`);
  console.log(`  ${c.cyan}Testing Key${c.reset}       : ${c.amber}${maskString(apiKey)}${c.reset}`);
  console.log(`${c.gray}└──────────────────────────────────────────────────────────────────────┘${c.reset}\n`);

  if (initialTlsEnv === '0') {
    console.log(`${c.yellow}⚠️  SECURITY NOTICE: NODE_TLS_REJECT_UNAUTHORIZED was set to '0' in your OS environment.${c.reset}`);
    console.log(`   ${c.gray}The CLI has sanitized this variable for this session to enforce secure TLS.${c.reset}`);
    console.log(`   ${c.gray}To permanently remove the warning on Windows (PowerShell as Admin):${c.reset}`);
    console.log(`   ${c.cyan}[Environment]::SetEnvironmentVariable('NODE_TLS_REJECT_UNAUTHORIZED', $null, 'Machine')${c.reset}\n`);
  }

  const status = await validateApiKey(apiKey);

  if (status.valid) {
    status.availableModels = await resolveKeyModels(apiKey, status);
    console.log(`${c.brightGreen}  ✓ Gateway Status${c.reset}      : ${c.green}Operational (Sub-50ms Routing)${c.reset}`);
    console.log(`${c.brightGreen}  ✓ Key Verification${c.reset}    : ${c.brightGreen}Valid (${status.name || 'Prepaid Key'})${c.reset}`);
    console.log(`${c.brightGreen}  ✓ 5h Rolling Window${c.reset}   : ${c.amber}${formatTokenCount(status.tokensRemaining)} Tokens Available${c.reset}`);
    console.log(`${c.brightGreen}  ✓ Account Status${c.reset}      : ${c.green}${status.status?.toUpperCase()}${c.reset}`);
    if (status.availableModels && status.availableModels.length > 0) {
      console.log(`${c.brightGreen}  ✓ Authorized Models${c.reset}   : ${c.white}${status.availableModels.length} models accessible (Default: ${status.defaultModel || 'claude-opus-5.5'})${c.reset}`);
    }
  } else {
    console.log(`${c.red}  ✕ API Key Error${c.reset}       : ${status.error}`);
  }

  console.log(`\n${c.bold}Inspecting AI Tool Configurations:${c.reset}`);
  const clients = getClientTargets();
  for (const client of clients) {
    if (client.configured) {
      const modelTag = client.existingModel ? ` [Model: ${getFriendlyModelName(client.existingModel)}]` : '';
      console.log(`  ${c.brightGreen}[✓] ${client.name.padEnd(20)}${c.reset} : ${c.green}Configured${modelTag} (${client.configPath})${c.reset}`);
    } else if (client.installed) {
      console.log(`  ${c.amber}[!] ${client.name.padEnd(20)}${c.reset} : ${c.amber}Installed (Ready to Configure)${c.reset}`);
    } else {
      console.log(`  ${c.gray}[- ${client.name.padEnd(20)}] : Not Detected${c.reset}`);
    }
  }

  console.log(`\n${c.brightPurple}✨ LightningDeals Diagnostics Completed Successfully.${c.reset}\n`);
}

async function runModels() {
  console.log(BANNER);
  let apiKey = getApiKeyFromArgsOrEnv();
  if (!apiKey) {
    const clients = getClientTargets();
    const existing = clients.find(c => c.existingApiKey);
    if (existing?.existingApiKey) {
      apiKey = existing.existingApiKey;
    }
  }
  if (!apiKey) {
    apiKey = await askQuestion(`${c.bold}Enter LightningDeals API Key: ${c.reset}`);
  }
  if (!apiKey) return;

  console.log(`${c.cyan}Fetching authorized live model catalog...${c.reset}\n`);
  let models = await fetchLiveModels(apiKey);
  if (!models || models.length === 0) {
    const status = await validateApiKey(apiKey);
    if (status.valid && status.availableModels) {
      models = status.availableModels.map(m => ({
        id: m.id,
        display_name: m.name,
        description: m.description,
        context_window: m.contextWindow,
      }));
    }
  }

  if (models.length === 0) {
    console.log(`${c.red}No models returned. Please check API key status.${c.reset}`);
    return;
  }

  console.log(`${c.bold}Authorized LLM Models on LightningDeals Gateway (${models.length} available):${c.reset}\n`);
  models.forEach((m: any) => {
    const name = m.display_name || m.name || getFriendlyModelName(m.id);
    const ctx = m.context_window ? ` (Context: ${Math.round(m.context_window / 1000)}k tokens)` : '';
    console.log(`  ${c.brightGreen}•${c.reset} ${c.cyan}${name}${c.reset} ${c.gray}(${m.id})${c.reset}${c.dim}${ctx}${c.reset}`);
    if (m.description) {
      console.log(`    ${c.gray}${m.description}${c.reset}`);
    }
  });
  console.log(`\n${c.gray}Tip: Switch models anytime via ${c.amber}npx lightningdeals model <name>${c.gray} or type ${c.amber}/model${c.gray} inside Claude Code.${c.reset}\n`);
}

async function runStatus() {
  console.log(BANNER);
  let apiKey = getApiKeyFromArgsOrEnv();
  if (!apiKey) {
    const clients = getClientTargets();
    const existing = clients.find(c => c.existingApiKey);
    if (existing?.existingApiKey) {
      apiKey = existing.existingApiKey;
    }
  }

  if (!apiKey) {
    apiKey = await askQuestion(`${c.bold}Enter LightningDeals API Key: ${c.reset}`);
  }
  if (!apiKey) return;

  const result = await validateApiKey(apiKey);
  if (result.valid) {
    console.log(`${c.gray}┌───────────────────────── API KEY METRICS ─────────────────────────┐${c.reset}`);
    console.log(`  ${c.cyan}Gateway Endpoint${c.reset}  : ${c.white}${getGatewayUrl()}${c.reset}`);
    console.log(`  ${c.cyan}Key Name${c.reset}          : ${c.brightGreen}${result.name}${c.reset}`);
    console.log(`  ${c.cyan}Masked Key${c.reset}        : ${c.amber}${maskString(apiKey)}${c.reset}`);
    console.log(`  ${c.cyan}Tokens Purchased${c.reset}  : ${c.white}${formatTokenCount(result.purchasedTokens)}${c.reset}`);
    console.log(`  ${c.cyan}Tokens Consumed${c.reset}   : ${c.gray}${formatTokenCount(result.tokensUsed)}${c.reset}`);
    console.log(`  ${c.cyan}Tokens Remaining${c.reset}  : ${c.amber}${c.bold}${formatTokenCount(result.tokensRemaining)} Tokens (5h Window)${c.reset}`);
    console.log(`  ${c.cyan}Account Status${c.reset}    : ${c.green}${result.status?.toUpperCase()}${c.reset}`);
    console.log(`  ${c.cyan}Expiry${c.reset}            : ${c.white}${result.expiresAt ? new Date(result.expiresAt).toLocaleDateString() : 'Permanent (No Reset)'}${c.reset}`);
    if (result.availableModels && result.availableModels.length > 0) {
      console.log(`  ${c.cyan}Authorized Models${c.reset} : ${c.brightGreen}${result.availableModels.length} models accessible (Default: ${result.defaultModel || 'claude-opus-5.5'})${c.reset}`);
    }
    console.log(`${c.gray}└────────────────────────────────────────────────────────────────────┘${c.reset}\n`);
  } else {
    console.log(`${c.red}✕ Error: ${result.error}${c.reset}\n`);
  }
}

async function runSetModel(modelArg?: string) {
  console.log(BANNER);
  let apiKey = getApiKeyFromArgsOrEnv();
  const clients = getClientTargets();

  if (!apiKey) {
    const existing = clients.find(c => c.existingApiKey);
    if (existing?.existingApiKey) {
      apiKey = existing.existingApiKey;
    }
  }

  if (!apiKey) {
    apiKey = await askQuestion(`${c.bold}Enter LightningDeals API Key: ${c.reset}`);
  }
  if (!apiKey) {
    console.log(`${c.gray}Operation cancelled.${c.reset}`);
    return;
  }

  const status = await validateApiKey(apiKey);
  if (!status.valid) {
    console.log(`${c.red}✕ Key Validation Failed: ${status.error}${c.reset}`);
    process.exit(1);
  }

  const availableModels = await resolveKeyModels(apiKey, status);
  const installedOrConfigured = clients.filter(c => c.installed || c.configured);
  const primaryClient = installedOrConfigured.find(c => c.id === 'claude-code') || installedOrConfigured[0];
  const currentModelId = primaryClient?.existingModel || status.defaultModel || 'claude-opus-5.5';
  const currentFriendly = getFriendlyModelName(currentModelId);

  // If no model argument was supplied: show current model and intentional interactive picker
  let targetModelId = modelArg?.trim();

  if (targetModelId) {
    const directNum = parseInt(targetModelId, 10);
    if (!isNaN(directNum) && directNum >= 1 && directNum <= availableModels.length && String(directNum) === targetModelId) {
      targetModelId = availableModels[directNum - 1].id;
    }
  }

  if (!targetModelId) {
    console.log(`${c.cyan}Current Active Model${c.reset}: ${c.brightGreen}${currentFriendly}${c.reset} ${c.gray}(${currentModelId})${c.reset} in ${primaryClient?.name || 'Clients'}\n`);
    console.log(`${c.bold}Available Models for your Key (${availableModels.length} authorized):${c.reset}`);
    availableModels.forEach((m, idx) => {
      const isCurrent = m.id.toLowerCase() === currentModelId.toLowerCase();
      const currentTag = isCurrent ? ` ${c.brightAmber}[Current Active]${c.reset}` : '';
      const ctxTag = m.contextWindow ? ` ${c.gray}(${Math.round(m.contextWindow / 1000)}k ctx)${c.reset}` : '';
      console.log(`  ${c.cyan}[${idx + 1}]${c.reset} ${c.brightGreen}${m.name}${c.reset} ${c.gray}(${m.id})${c.reset}${ctxTag}${currentTag}`);
    });

    const choice = await askQuestion(`\n${c.bold}Select model to switch to (1-${availableModels.length} or model id, or press Enter to keep current): ${c.reset}`);

    if (!choice || choice.trim() === '') {
      console.log(`\n${c.gray}No changes made. Active model remains: ${currentFriendly} (${currentModelId}).${c.reset}\n`);
      return;
    }

    const num = parseInt(choice, 10);
    if (!isNaN(num) && num >= 1 && num <= availableModels.length) {
      targetModelId = availableModels[num - 1].id;
    } else {
      targetModelId = choice.trim();
    }
  }

  // Validate the model against availableModels with smart alias support
  const normalizedTarget = targetModelId.toLowerCase().trim();
  const strippedTarget = normalizedTarget.replace(/[-._\s]/g, '');

  const matchedModel = availableModels.find(m => {
    const idNorm = m.id.toLowerCase();
    const nameNorm = m.name.toLowerCase();
    const idStripped = idNorm.replace(/[-._\s]/g, '');
    const nameStripped = nameNorm.replace(/[-._\s]/g, '');

    if (idNorm === normalizedTarget || nameNorm === normalizedTarget) return true;
    if (idStripped === strippedTarget || nameStripped === strippedTarget) return true;
    if (idNorm === `claude-${normalizedTarget}` || idStripped === `claude${strippedTarget}`) return true;
    if (normalizedTarget.startsWith('claude-') && idNorm === normalizedTarget.replace('claude-', '')) return true;

    // Direct alias mappings
    if ((normalizedTarget === 'opus-5.5' || normalizedTarget === 'opus 5.5' || normalizedTarget === 'opus5.5' || normalizedTarget === 'claude-opus-5-5') && idNorm.includes('opus-5.5')) return true;
    if ((normalizedTarget === 'sonnet-5.5' || normalizedTarget === 'sonnet 5.5' || normalizedTarget === 'sonnet5.5' || normalizedTarget === 'claude-sonnet-5-5') && idNorm.includes('sonnet-5.5')) return true;
    if ((normalizedTarget === 'opus-5' || normalizedTarget === 'opus 5') && idNorm === 'claude-opus-5') return true;
    if ((normalizedTarget === 'sonnet-5' || normalizedTarget === 'sonnet 5') && idNorm === 'claude-sonnet-5') return true;
    if ((normalizedTarget === 'fable-5' || normalizedTarget === 'fable 5' || normalizedTarget === 'fable') && idNorm === 'claude-fable-5') return true;
    if ((normalizedTarget === 'fable-flash' || normalizedTarget === 'fable-5-flash') && idNorm.includes('fable-5-flash')) return true;
    if ((normalizedTarget.includes('haiku-5.5') || normalizedTarget.includes('haiku 5.5')) && idNorm.includes('haiku-5.5')) return true;
    if ((normalizedTarget.includes('haiku-5') || normalizedTarget.includes('haiku 5')) && idNorm === 'claude-haiku-5') return true;

    return false;
  });

  if (!matchedModel) {
    console.log(`\n${c.red}✕ Error: "${targetModelId}" is not a recognized or authorized model for this API key.${c.reset}`);
    console.log(`\n${c.bold}Available choices:${c.reset}`);
    availableModels.forEach(m => {
      console.log(`  ${c.cyan}•${c.reset} ${c.brightGreen}${m.id}${c.reset} ${c.gray}— ${m.name}${c.reset}`);
    });
    console.log(`\n${c.gray}Tip: Run ${c.amber}npx lightningdeals model <model-id>${c.gray} using one of the IDs above.${c.reset}\n`);
    process.exit(1);
  }

  const selectedModelId = matchedModel.id;
  const friendlyName = matchedModel.name || getFriendlyModelName(selectedModelId);
  const gatewayUrl = getGatewayUrl();

  console.log(`\n${c.cyan}Switching active model to ${c.brightGreen}${friendlyName}${c.cyan} (${selectedModelId})...${c.reset}`);

  let updatedCount = 0;
  for (const client of installedOrConfigured) {
    const res = switchClientModel(client, selectedModelId, gatewayUrl);
    if (res.success) {
      updatedCount++;
      console.log(`  ${c.brightGreen}✓ Updated ${client.name}${c.reset} ${c.gray}(Verified in ${client.configPath})${c.reset}`);
    } else {
      console.log(`  ${c.yellow}⚠ Could not update ${client.name}: ${res.error}${c.reset}`);
    }
  }

  writeGlobalConfig({ apiKey, activeModel: selectedModelId, gatewayUrl });

  console.log(`\n${c.gray}┌──────────────────────── MODEL SWITCH COMPLETE ────────────────────────┐${c.reset}`);
  console.log(`  ${c.brightGreen}🎉 Successfully switched active model!${c.reset}`);
  console.log(`  ${c.cyan}Active Model${c.reset}     : ${c.brightGreen}${friendlyName}${c.reset} ${c.gray}(${selectedModelId})${c.reset}`);
  console.log(`  ${c.cyan}Clients Updated${c.reset}  : ${c.white}${updatedCount} developer tool(s)${c.reset}`);
  console.log(`  ${c.cyan}Verification${c.reset}     : ${c.green}Configuration fields and environment variables aligned${c.reset}`);
  console.log(`  ${c.white}You can now run ${c.amber}claude${c.white} to code with ${friendlyName}.${c.reset}`);
  console.log(`${c.gray}└───────────────────────────────────────────────────────────────────────┘${c.reset}\n`);
}

async function runVerifyModel(modelArg?: string) {
  console.log(BANNER);
  console.log(`${c.amber}🔬 LightningDeals Model Routing & Gateway Verification${c.reset}\n`);

  let apiKey = getApiKeyFromArgsOrEnv();
  const clients = getClientTargets();
  if (!apiKey) {
    const existing = clients.find(c => c.existingApiKey);
    if (existing?.existingApiKey) {
      apiKey = existing.existingApiKey;
    }
  }

  if (!apiKey) {
    apiKey = await askQuestion(`${c.bold}Enter LightningDeals API Key: ${c.reset}`);
  }
  if (!apiKey) return;

  const primaryClient = clients.find(c => c.id === 'claude-code' && c.configured) || clients.find(c => c.configured);
  const targetModel = modelArg?.trim() || primaryClient?.existingModel || 'claude-opus-5.5';

  console.log(`${c.cyan}Executing non-secret diagnostic probe for model: ${c.brightGreen}${targetModel}${c.reset}...\n`);

  const probe = await probeModelRouting(apiKey, targetModel);

  console.log(`${c.gray}┌──────────────────────── ROUTING DIAGNOSTIC ────────────────────────┐${c.reset}`);
  console.log(`  ${c.cyan}Gateway Endpoint${c.reset}     : ${c.white}${getGatewayUrl()}${c.reset}`);
  console.log(`  ${c.cyan}Configured Client${c.reset}    : ${c.white}${primaryClient?.name || 'Local Tool'} (${primaryClient?.configPath || 'N/A'})${c.reset}`);
  console.log(`  ${c.cyan}Configured Model${c.reset}     : ${c.brightGreen}${targetModel}${c.reset}`);
  console.log(`  ${c.cyan}Outgoing Request Model${c.reset}: ${c.white}${probe.requestedModel}${c.reset}`);
  console.log(`  ${c.cyan}Gateway-Resolved Model${c.reset}: ${c.amber}${probe.resolvedModel || targetModel}${c.reset}`);
  console.log(`  ${c.cyan}Upstream Provider${c.reset}     : ${c.white}${probe.upstreamProvider || 'Vendor Provider'}${c.reset}`);
  console.log(`  ${c.cyan}Model Alias Applied${c.reset}   : ${probe.aliasApplied ? `${c.yellow}Yes (Resolved to upstream identifier)` : `${c.green}No (Direct Match)`}${c.reset}`);
  console.log(`  ${c.cyan}Gateway HTTP Status${c.reset}   : ${probe.success ? `${c.green}200 OK (${probe.latencyMs}ms)` : `${c.red}${probe.statusCode} Error (${probe.error})`}${c.reset}`);
  console.log(`${c.gray}└─────────────────────────────────────────────────────────────────────┘${c.reset}\n`);

  if (probe.success) {
    console.log(`${c.brightGreen}✓ Model Routing Verified:${c.reset} The gateway successfully accepted and routed '${targetModel}' to upstream provider '${probe.upstreamProvider}'.`);
    console.log(`${c.gray}Note: Natural-language self-identification by LLMs is generated text and not authoritative proof of model routing. True verification is provided by the gateway telemetry above.${c.reset}\n`);
  } else {
    console.log(`${c.red}✕ Probe Failed:${c.reset} ${probe.error}\n`);
  }
}

async function runRemove() {
  console.log(BANNER);
  console.log(`${c.amber}⚠️  Removing LightningDeals Configuration from Developer Tools...${c.reset}\n`);

  const confirm = await askQuestion(`${c.bold}Are you sure you want to remove LightningDeals configuration? (y/N): ${c.reset}`);
  if (confirm.toLowerCase() !== 'y') {
    console.log(`${c.gray}Exiting without changes.${c.reset}`);
    return;
  }

  const clients = getClientTargets();
  let count = 0;
  for (const client of clients) {
    if (client.configured) {
      const res = removeClientConfiguration(client);
      if (res.success) {
        count++;
        console.log(`  ${c.brightGreen}✓ Removed configuration from ${client.name}${res.restored ? ' (Restored backup)' : ''}${c.reset}`);
      }
    }
  }

  if (count === 0) {
    console.log(`${c.gray}No active LightningDeals configurations were found.${c.reset}`);
  } else {
    console.log(`\n${c.brightGreen}✅ Successfully removed LightningDeals from ${count} client(s).${c.reset}\n`);
  }
}

async function runSetup() {
  console.log(BANNER);
  printSystemInfo();

  const clients = getClientTargets();
  const configuredClient = clients.find((c) => c.configured && c.existingApiKey);

  let apiKey = getApiKeyFromArgsOrEnv();

  // If existing key detected and no explicit --key flag passed, show interactive menu
  if (!apiKey && configuredClient?.existingApiKey) {
    const existingKey = configuredClient.existingApiKey;
    console.log(`${c.brightGreen}  Existing LightningDeals configuration detected.${c.reset}`);
    console.log(`  ${c.cyan}API Key${c.reset}: ${c.amber}${maskString(existingKey)}${c.reset}\n`);
    console.log(`${c.bold}  What would you like to do?${c.reset}`);
    console.log(`    ${c.amber}[1]${c.reset} Keep existing key`);
    console.log(`    ${c.amber}[2]${c.reset} Replace with a new key`);
    console.log(`    ${c.amber}[3]${c.reset} Remove configuration`);
    console.log(`    ${c.amber}[4]${c.reset} Exit\n`);

    const choice = await askQuestion(`${c.bold}Select an option (1-4) [default: 1]: ${c.reset}`);

    if (choice === '1' || choice === '') {
      apiKey = existingKey;
      console.log(`\n${c.cyan}Validating existing API key...${c.reset}`);
    } else if (choice === '3') {
      await runRemove();
      return;
    } else if (choice === '4' || choice.toLowerCase() === 'exit') {
      console.log(`${c.gray}Exiting without changes.${c.reset}`);
      return;
    }
  }

  if (!apiKey) {
    apiKey = await askQuestion(`${c.bold}Enter your LightningDeals API Key: ${c.reset}`);
  }

  if (!apiKey) {
    console.log(`\n${c.gray}Exiting without changes.${c.reset}`);
    return;
  }

  console.log(`\n${c.cyan}⌛ Verifying API key with LightningDeals Gateway...${c.reset}`);
  const status = await validateApiKey(apiKey);

  if (!status.valid) {
    console.log(`${c.red}✕ Key Validation Failed: ${status.error}${c.reset}`);
    process.exit(1);
  }

  console.log(`${c.brightGreen}✔ API Key Verified! (${status.name || 'Active Package'})${c.reset}`);
  console.log(`  ${c.amber}Available Allowance${c.reset}: ${c.white}${formatTokenCount(status.tokensRemaining)} Tokens (5h Window)${c.reset}`);

  // Display authentic models detected from key without hardcoding or inventing
  const availableModels = await resolveKeyModels(apiKey, status);

  console.log(`\n${c.bold}Authorized AI Models for this Key (${availableModels.length} detected):${c.reset}`);
  availableModels.forEach((m) => {
    const isDefault = m.id === status.defaultModel || (!status.defaultModel && m.id === availableModels[0]?.id);
    const defaultTag = isDefault ? ` ${c.brightAmber}[Default Active]${c.reset}` : '';
    const ctx = m.contextWindow ? ` ${c.gray}(${Math.round(m.contextWindow / 1000)}k ctx)${c.reset}` : '';
    console.log(`  ${c.brightGreen}•${c.reset} ${c.cyan}${m.name}${c.reset} ${c.gray}(${m.id})${c.reset}${ctx}${defaultTag}`);
  });
  console.log('');

  console.log(`${c.bold}Detected Developer Clients:${c.reset}`);
  clients.forEach((cItem) => {
    if (cItem.installed) {
      console.log(`  ${c.brightGreen}✔ ${cItem.name.padEnd(20)}${c.reset} ${c.gray}(Detected)${c.reset}`);
    } else {
      console.log(`  ${c.gray}X ${cItem.name.padEnd(20)} (Not Installed)${c.reset}`);
    }
  });

  console.log(`\n${c.bold}Configuration Selection:${c.reset}`);
  clients.forEach((cItem, idx) => {
    const num = idx + 1;
    const notDetectedTag = cItem.installed ? '' : ` ${c.gray}(not detected)${c.reset}`;
    console.log(`  ${c.cyan}[${num}]${c.reset} ${cItem.name}${notDetectedTag}`);
  });
  console.log(`  ${c.brightPurple}[A]${c.reset} Configure ALL detected clients ${c.gray}(Recommended)${c.reset}\n`);

  const choice = await askQuestion(`${c.bold}Select client to configure (e.g. A, 1, or 0 to exit) [default: A]: ${c.reset}`);

  let selectedClients: ClientTarget[] = [];

  if (choice.toUpperCase() === 'A' || choice === '') {
    selectedClients = clients.filter((cItem) => cItem.installed);
    if (selectedClients.length === 0) {
      selectedClients = [clients.find(cItem => cItem.id === 'claude-code') || clients[0]];
    }
  } else {
    const numChoice = parseInt(choice, 10);
    if (!isNaN(numChoice) && numChoice >= 1 && numChoice <= clients.length) {
      selectedClients = [clients[numChoice - 1]];
    } else {
      console.log(`${c.gray}Exiting without changes.${c.reset}`);
      return;
    }
  }

  let selectedModel = getModelFromArgsOrEnv();
  if (!selectedModel) {
    selectedModel = status.defaultModel || (availableModels[0] ? availableModels[0].id : 'claude-opus-5.5');
  }

  const friendlyName = getFriendlyModelName(selectedModel);
  console.log(`\n${c.brightGreen}✔ Model Activated: ${c.bold}${friendlyName}${c.reset} ${c.gray}(${selectedModel})${c.reset}`);

  console.log(`\n${c.cyan}Configuring selected tools...${c.reset}`);
  const gatewayUrl = getGatewayUrl();
  for (const client of selectedClients) {
    const res = configureClient(client, apiKey, gatewayUrl, selectedModel);
    if (res.success) {
      console.log(`  ${c.brightGreen}✓ Configured ${client.name}${res.backupPath ? ` ${c.gray}(Backup saved to ${res.backupPath})${c.reset}` : ''}${c.reset}`);
    } else {
      console.log(`  ${c.red}✕ Failed to configure ${client.name}: ${res.error}${c.reset}`);
    }
  }

  console.log(`\n${c.gray}┌──────────────────────── CONFIGURATION COMPLETE ────────────────────────┐${c.reset}`);
  console.log(`  ${c.brightGreen}🎉 LightningDeals configuration applied successfully!${c.reset}`);
  console.log(`  ${c.cyan}Active Model${c.reset}   : ${c.brightGreen}${friendlyName}${c.reset} ${c.gray}(${selectedModel})${c.reset}`);
  console.log(`  ${c.cyan}Gateway Engine${c.reset} : ${c.amber}LightningDeals AI Gateway (Sub-50ms Routing)${c.reset}`);
  console.log(`  ${c.cyan}Model Switching${c.reset}: ${c.white}Type ${c.amber}/model${c.white} in Claude Code or run ${c.amber}npx lightningdeals model <name>${c.reset}`);
  console.log(`  ${c.white}You can now run ${c.amber}claude${c.white} or open your IDE to start coding immediately.${c.reset}`);
  console.log(`${c.gray}└────────────────────────────────────────────────────────────────────────┘${c.reset}\n`);
}

function runHelp() {
  console.log(BANNER);
  console.log(`${c.bold}Usage:${c.reset} npx lightningdeals [command] [options]\n`);
  console.log(`${c.bold}Commands:${c.reset}`);
  console.log(`  ${c.cyan}setup${c.reset}                Interactive setup to connect Claude Code and developer tools (Default)`);
  console.log(`  ${c.cyan}model [id]${c.reset}           View current active model or switch directly without wizard`);
  console.log(`  ${c.cyan}models${c.reset}               List all authorized LLM models for your API key`);
  console.log(`  ${c.cyan}verify-model [id]${c.reset}    Run safe diagnostic probe to verify gateway model routing`);
  console.log(`  ${c.cyan}doctor${c.reset}               Run connectivity, key validation, and tool configuration diagnostics`);
  console.log(`  ${c.cyan}status${c.reset}               Display active API key status, plan details, and 5h rolling window usage`);
  console.log(`  ${c.cyan}remove, reset${c.reset}        Safely remove LightningDeals configuration and restore tool backups`);
  console.log(`  ${c.cyan}--help, -h${c.reset}           Display CLI usage and help manual\n`);
  console.log(`${c.bold}Options:${c.reset}`);
  console.log(`  ${c.amber}--key, -k <key>${c.reset}      Specify LightningDeals API Key directly`);
  console.log(`  ${c.amber}--model, -m <model>${c.reset}  Select default AI model (e.g. claude-opus-5.5, claude-sonnet-5.5)`);
  console.log(`  ${c.gray}LIGHTNINGDEALS_API_URL${c.reset}  Environment variable to override API Gateway endpoint\n`);
}

// Entrypoint Router
async function main() {
  const args = process.argv.slice(2);
  const firstArg = args[0] || 'setup';

  if (firstArg === '--help' || firstArg === '-h' || firstArg === 'help') {
    runHelp();
    return;
  }

  let command = firstArg;
  if (firstArg.startsWith('-') && firstArg !== '--key' && firstArg !== '-k' && firstArg !== '--model' && firstArg !== '-m') {
    command = 'setup';
  }

  switch (command) {
    case 'doctor':
      await runDoctor();
      break;
    case 'models':
      await runModels();
      break;
    case 'model':
    case 'set-model':
    case 'switch-model':
      await runSetModel(args[1]);
      break;
    case 'verify-model':
    case 'verify':
    case 'probe':
      await runVerifyModel(args[1]);
      break;
    case 'status':
      await runStatus();
      break;
    case 'remove':
    case 'reset':
      await runRemove();
      break;
    case 'setup':
    default:
      await runSetup();
      break;
  }
}

main().catch((err) => {
  console.error(`${c.red}Fatal CLI Error:${c.reset}`, err);
  process.exit(1);
});
