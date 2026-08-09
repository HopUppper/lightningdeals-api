#!/usr/bin/env node
import readline from 'readline';
import os from 'os';

import { validateApiKey, fetchLiveModels, testApiRequest, getGatewayUrl } from './api.js';
import { getClientTargets, configureClient, removeClientConfiguration, ClientTarget } from './clients.js';

const BANNER = `
  ██╗     ██╗██████╗ ██╗  ██╗████████╗███╗   ██╗██╗███╗   ██╗██████╗ 
  ██║     ██║██╔════╝ ██║  ██║╚══██╔══╝████╗  ██║██║████╗  ██║██╔════╝ 
  ██║     ██║██║  ███╗███████║   ██║   ██╔██╗ ██║██║██╔██╗ ██║██║  ███╗
  ██║     ██║██║   ██║██╔══██║   ██║   ██║╚██╗██║██║██║╚██╗██║██║   ██║
  ███████╗██║╚██████╔╝██║  ██║   ██║   ██║ ╚████║██║██║ ╚████║╚██████╔╝
  ╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═══╝╚═╝╚═╝  ╚═══╝ ╚═════╝ 

  ⚡ LIGHTNINGDEALS Setup Wizard ── Connect every AI coding client in seconds.
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
  console.log(`\n  ✓ Operating system:     ${os.platform()}`);
  console.log(`  ✓ Architecture:       ${os.arch()}`);
  console.log(`  ✓ Node.js:            ${process.version}`);
  console.log(`  ✓ Gateway Endpoint:   ${getGatewayUrl()}\n`);
}

async function runDoctor() {
  console.log(BANNER);
  console.log('🔍 Running LightningDeals Diagnostics Doctor...\n');

  let apiKey = getApiKeyFromArgsOrEnv();

  if (!apiKey) {
    const clients = getClientTargets();
    const existing = clients.find(c => c.existingApiKey);
    if (existing?.existingApiKey) {
      apiKey = existing.existingApiKey;
    }
  }

  if (!apiKey) {
    console.log('! No active LightningDeals API key passed or found in environment.');
    apiKey = await askQuestion('Enter your LightningDeals API Key (ld_live_...): ');
  }

  if (!apiKey) {
    console.log('✕ Doctor aborted: API key is required.');
    process.exit(1);
  }

  const gatewayUrl = getGatewayUrl();
  console.log(`Endpoint:               ${gatewayUrl}`);
  console.log(`TLS Verification:       ENABLED`);
  console.log(`Testing API Key:        ${maskString(apiKey)}`);

  const status = await validateApiKey(apiKey);

  if (status.valid) {
    console.log(`✓ LightningDeals Gateway: Reachable`);
    console.log(`✓ API Key:              Valid (${status.name || 'Prepaid Key'})`);
    console.log(`✓ 5-Hour Rolling Window: Available (${formatTokenCount(status.tokensRemaining)} Tokens Remaining in 5h Window)`);
    console.log(`✓ Account Status:       ${status.status?.toUpperCase()}`);
  } else {
    console.log(`✕ API Key Error:        ${status.error}`);
  }

  console.log('\nInspecting Tool Client Configurations:');
  const clients = getClientTargets();
  for (const client of clients) {
    if (client.configured) {
      console.log(`  ✓ ${client.name} — Configured (${client.configPath})`);
    } else if (client.installed) {
      console.log(`  - ${client.name} — Installed, not configured`);
    } else {
      console.log(`  . ${client.name} — Not installed`);
    }
  }

  console.log('\n✨ LightningDeals Doctor Completed.');
}

async function runModels() {
  console.log(BANNER);
  let apiKey = getApiKeyFromArgsOrEnv();
  if (!apiKey) {
    apiKey = await askQuestion('Enter LightningDeals API Key: ');
  }
  if (!apiKey) return;

  console.log('Fetching live model catalog...\n');
  const models = await fetchLiveModels(apiKey);
  if (models.length === 0) {
    console.log('No models returned. Verify API key and backend server status.');
    return;
  }

  console.log('Available LLM Models:');
  models.forEach((m: any) => {
    console.log(`• ${m.id || m.name} (Context: ${m.context_window ? (m.context_window / 1000) + 'K' : '1M'})`);
  });
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
    apiKey = await askQuestion('Enter LightningDeals API Key: ');
  }
  if (!apiKey) return;

  const result = await validateApiKey(apiKey);
  if (result.valid) {
    console.log(`LightningDeals API: Connected (${getGatewayUrl()})`);
    console.log(`Key Name:           ${result.name}`);
    console.log(`Masked Key:         ${maskString(apiKey)}`);
    console.log(`Tokens Purchased:   ${formatTokenCount(result.purchasedTokens)}`);
    console.log(`Tokens Consumed:    ${formatTokenCount(result.tokensUsed)}`);
    console.log(`Tokens Remaining:   ${formatTokenCount(result.tokensRemaining)}`);
    console.log(`Account Status:     ${result.status?.toUpperCase()}`);
    console.log(`Expiry:             ${result.expiresAt ? new Date(result.expiresAt).toLocaleDateString() : 'Permanent (No Reset)'}`);
  } else {
    console.log(`✕ Error: ${result.error}`);
  }
}

async function runRemove() {
  console.log(BANNER);
  console.log('⚠️ Removing LightningDeals Configuration from Developer Tools...\n');

  const confirm = await askQuestion('Are you sure you want to remove LightningDeals configuration? (y/N): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log('Exiting without changes.');
    return;
  }

  const clients = getClientTargets();
  let count = 0;
  for (const client of clients) {
    if (client.configured) {
      const res = removeClientConfiguration(client);
      if (res.success) {
        count++;
        console.log(`✓ Removed configuration from ${client.name}${res.restored ? ' (Restored backup)' : ''}`);
      }
    }
  }

  if (count === 0) {
    console.log('No active LightningDeals configurations were found.');
  } else {
    console.log(`\n✅ Successfully removed LightningDeals from ${count} client(s).`);
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
    console.log(`  Existing LightningDeals configuration detected.`);
    console.log(`  API key: ${maskString(existingKey)}\n`);
    console.log('  What would you like to do?');
    console.log('    1. Keep existing key');
    console.log('    2. Replace with a new key');
    console.log('    3. Remove configuration');
    console.log('    4. Exit\n');

    const choice = await askQuestion('Select an option (1-4): ');

    if (choice === '1' || choice === '') {
      apiKey = existingKey;
      console.log('\nValidating existing key...');
      const status = await validateApiKey(apiKey);
      if (status.valid) {
        console.log(`✓ Key Verified (${formatTokenCount(status.tokensRemaining)} Tokens Remaining)`);
        console.log('\nExiting without changes.');
        return;
      } else {
        console.log(`! Existing key validation failed: ${status.error}`);
        apiKey = '';
      }
    } else if (choice === '3') {
      await runRemove();
      return;
    } else if (choice === '4' || choice.toLowerCase() === 'exit') {
      console.log('Exiting without changes.');
      return;
    }
  }

  if (!apiKey) {
    apiKey = await askQuestion('Enter your LightningDeals API Key (ld_live_...): ');
  }

  if (!apiKey) {
    console.log('\nExiting without changes.');
    return;
  }

  console.log(`\nValidating key ${maskString(apiKey)} with LightningDeals Gateway (${getGatewayUrl()})...`);
  const status = await validateApiKey(apiKey);

  if (!status.valid) {
    console.log(`✕ Validation Failed: ${status.error}`);
    process.exit(1);
  }

  console.log(`✓ API Key Verified! (${formatTokenCount(status.tokensRemaining)} Tokens Remaining)`);

  const installedClients = clients.filter((c) => c.installed);

  if (installedClients.length === 0) {
    console.log('\n! No supported IDEs or CLIs were detected on standard paths.');
    console.log('Defaulting to Claude Code CLI setup...');
    installedClients.push(clients[0]);
  }

  console.log('\nDetected Developer Tools:');
  installedClients.forEach((c, idx) => {
    console.log(`  [${idx + 1}] ${c.name}${c.configured ? ' (Currently Configured)' : ''}`);
  });

  const choice = await askQuestion('\nConfigure all detected tools? (Y/n): ');

  let selectedClients: ClientTarget[] = [];

  if (choice.toLowerCase() === 'n') {
    console.log('\nSelect specific tool to configure:');
    installedClients.forEach((c, idx) => {
      console.log(`  [${idx + 1}] ${c.name}`);
    });
    console.log(`  [0] Exit without making changes\n`);

    const toolChoice = await askQuestion('Select tool number (or 0 to exit): ');
    const selectedIdx = parseInt(toolChoice, 10) - 1;

    if (isNaN(selectedIdx) || selectedIdx < 0 || selectedIdx >= installedClients.length) {
      console.log('Exiting without changes.');
      return;
    }

    selectedClients = [installedClients[selectedIdx]];
  } else {
    selectedClients = installedClients;
  }

  console.log('\nConfiguring selected tools:');
  const gatewayUrl = getGatewayUrl();
  for (const client of selectedClients) {
    const res = configureClient(client, apiKey, gatewayUrl);
    if (res.success) {
      console.log(`  ✓ Configured ${client.name}${res.backupPath ? ` (Backup saved to ${res.backupPath})` : ''}`);
    } else {
      console.log(`  ✕ Failed to configure ${client.name}: ${res.error}`);
    }
  }

  console.log('\n🎉 LightningDeals configuration complete!');
  console.log('You can now run "claude" or open Cursor/Windsurf to start coding.');
}

function runHelp() {
  console.log(BANNER);
  console.log('Usage: npx lightningdeals [command] [options]\n');
  console.log('Commands:');
  console.log('  setup                Interactive setup to connect Claude Code and developer tools (Default)');
  console.log('  doctor               Run connectivity, key validation, and tool configuration diagnostics');
  console.log('  status               Display active API key status, plan details, and 5h rolling window usage');
  console.log('  models               List available LLM models on the LightningDeals API Gateway');
  console.log('  remove, reset        Safely remove LightningDeals configuration and restore tool backups');
  console.log('  --help, -h           Display CLI usage and help manual\n');
  console.log('Options:');
  console.log('  --key, -k <key>      Specify LightningDeals API Key directly (e.g. ld_live_...)');
  console.log('  LIGHTNINGDEALS_API_URL  Environment variable to override API Gateway endpoint\n');
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
  console.error('Fatal CLI Error:', err);
  process.exit(1);
});
