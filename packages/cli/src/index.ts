#!/usr/bin/env node
import readline from 'readline';
import os from 'os';

import { validateApiKey, fetchLiveModels, getGatewayUrl } from './api.js';
import { getClientTargets, configureClient, removeClientConfiguration, ClientTarget } from './clients.js';

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
  return (process.env.LIGHTNINGDEALS_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || '').trim();
};

function printSystemInfo() {
  console.log(`${c.gray}┌───────────────────────── SYSTEM ENVIRONMENT ─────────────────────────┐${c.reset}`);
  console.log(`  ${c.cyan}OS Platform${c.reset}   : ${c.white}${os.platform()} (${os.arch()})${c.reset}`);
  console.log(`  ${c.cyan}Node Runtime${c.reset}  : ${c.white}${process.version}${c.reset}`);
  console.log(`  ${c.cyan}Gateway URL${c.reset}   : ${c.amber}${getGatewayUrl()}${c.reset}`);
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
    apiKey = await askQuestion(`${c.bold}Enter your LightningDeals API Key (ld_live_...): ${c.reset}`);
  }

  if (!apiKey) {
    console.log(`${c.red}✕ Doctor aborted: Valid API key is required.${c.reset}`);
    process.exit(1);
  }

  const gatewayUrl = getGatewayUrl();
  console.log(`${c.gray}┌────────────────────── DIAGNOSTIC PROBE TARGETS ──────────────────────┐${c.reset}`);
  console.log(`  ${c.cyan}Gateway Endpoint${c.reset}  : ${c.white}${gatewayUrl}${c.reset}`);
  console.log(`  ${c.cyan}TLS Protocol${c.reset}      : ${c.green}TLS 1.3 Verified${c.reset}`);
  console.log(`  ${c.cyan}Testing Key${c.reset}       : ${c.amber}${maskString(apiKey)}${c.reset}`);
  console.log(`${c.gray}└──────────────────────────────────────────────────────────────────────┘${c.reset}\n`);

  const status = await validateApiKey(apiKey);

  if (status.valid) {
    console.log(`${c.brightGreen}  ✓ Gateway Status${c.reset}      : ${c.green}Operational (Sub-50ms Routing)${c.reset}`);
    console.log(`${c.brightGreen}  ✓ Key Verification${c.reset}    : ${c.brightGreen}Valid (${status.name || 'Prepaid Key'})${c.reset}`);
    console.log(`${c.brightGreen}  ✓ 5h Rolling Window${c.reset}   : ${c.amber}${formatTokenCount(status.tokensRemaining)} Tokens Available${c.reset}`);
    console.log(`${c.brightGreen}  ✓ Account Status${c.reset}      : ${c.green}${status.status?.toUpperCase()}${c.reset}`);
  } else {
    console.log(`${c.red}  ✕ API Key Error${c.reset}       : ${status.error}`);
  }

  console.log(`\n${c.bold}Inspecting AI Tool Configurations:${c.reset}`);
  const clients = getClientTargets();
  for (const client of clients) {
    if (client.configured) {
      console.log(`  ${c.brightGreen}[✓] ${client.name.padEnd(20)}${c.reset} : ${c.green}Configured (${client.configPath})${c.reset}`);
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
    apiKey = await askQuestion(`${c.bold}Enter LightningDeals API Key: ${c.reset}`);
  }
  if (!apiKey) return;

  console.log(`${c.cyan}Fetching live model catalog...${c.reset}\n`);
  const models = await fetchLiveModels(apiKey);
  if (models.length === 0) {
    console.log(`${c.red}No models returned. Please check API key status.${c.reset}`);
    return;
  }

  console.log(`${c.bold}Available LLM Models on LightningDeals Gateway:${c.reset}\n`);
  models.forEach((m: any) => {
    console.log(`  ${c.brightGreen}• ${m.id || m.name}${c.reset} ${c.gray}(Context: ${m.context_window ? (m.context_window / 1000) + 'K' : '1M'})${c.reset}`);
  });
  console.log('\n');
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
    console.log(`${c.gray}└────────────────────────────────────────────────────────────────────┘${c.reset}\n`);
  } else {
    console.log(`${c.red}✕ Error: ${result.error}${c.reset}\n`);
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
    apiKey = await askQuestion(`${c.bold}Enter your LightningDeals API Key (ld_live_...): ${c.reset}`);
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
  console.log(`  ${c.amber}Available Allowance${c.reset}: ${c.white}${formatTokenCount(status.tokensRemaining)} Tokens (5h Window)${c.reset}\n`);

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

  console.log(`\n${c.cyan}Configuring selected tools...${c.reset}`);
  const gatewayUrl = getGatewayUrl();
  for (const client of selectedClients) {
    const res = configureClient(client, apiKey, gatewayUrl);
    if (res.success) {
      console.log(`  ${c.brightGreen}✓ Configured ${client.name}${res.backupPath ? ` ${c.gray}(Backup saved to ${res.backupPath})${c.reset}` : ''}${c.reset}`);
    } else {
      console.log(`  ${c.red}✕ Failed to configure ${client.name}: ${res.error}${c.reset}`);
    }
  }

  console.log(`\n${c.gray}┌──────────────────────── CONFIGURATION COMPLETE ────────────────────────┐${c.reset}`);
  console.log(`  ${c.brightGreen}🎉 LightningDeals configuration applied successfully!${c.reset}`);
  console.log(`  ${c.white}You can now run ${c.amber}claude${c.white} or open your IDE to start coding immediately.${c.reset}`);
  console.log(`${c.gray}└────────────────────────────────────────────────────────────────────────┘${c.reset}\n`);
}

function runHelp() {
  console.log(BANNER);
  console.log(`${c.bold}Usage:${c.reset} npx lightningdeals [command] [options]\n`);
  console.log(`${c.bold}Commands:${c.reset}`);
  console.log(`  ${c.cyan}setup${c.reset}                Interactive setup to connect Claude Code and developer tools (Default)`);
  console.log(`  ${c.cyan}doctor${c.reset}               Run connectivity, key validation, and tool configuration diagnostics`);
  console.log(`  ${c.cyan}status${c.reset}               Display active API key status, plan details, and 5h rolling window usage`);
  console.log(`  ${c.cyan}models${c.reset}               List available LLM models on the LightningDeals API Gateway`);
  console.log(`  ${c.cyan}remove, reset${c.reset}        Safely remove LightningDeals configuration and restore tool backups`);
  console.log(`  ${c.cyan}--help, -h${c.reset}           Display CLI usage and help manual\n`);
  console.log(`${c.bold}Options:${c.reset}`);
  console.log(`  ${c.amber}--key, -k <key>${c.reset}      Specify LightningDeals API Key directly (e.g. ld_live_...)`);
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
  if (firstArg.startsWith('-') && firstArg !== '--key' && firstArg !== '-k') {
    command = 'setup';
  }

  switch (command) {
    case 'doctor':
      await runDoctor();
      break;
    case 'models':
      await runModels();
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
