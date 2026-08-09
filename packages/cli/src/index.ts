#!/usr/bin/env node
import readline from 'readline';

import { validateApiKey, fetchLiveModels, testApiRequest, getGatewayUrl } from './api.js';
import { getClientTargets, configureClient, removeClientConfiguration, ClientTarget } from './clients.js';

const BANNER = `
⚡ LightningDeals CLI v1.0.0
   The simple way to power your AI tools.
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

async function runDoctor() {
  console.log(BANNER);
  console.log('🔍 Running LightningDeals Diagnostics Doctor...\n');

  let apiKey = getApiKeyFromArgsOrEnv();

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
  console.log(`Mock Guard:             ${process.env.NODE_ENV === 'production' ? 'ENABLED (Production Guard 503 Active)' : 'DEVELOPMENT ONLY'}`);
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

  console.log('\nTesting Gateway & Provider Connection...');
  const ping = await testApiRequest(apiKey);
  if (ping.success) {
    const isSimulated = ping.responseText?.includes('[Development Mode]');
    console.log(`✓ Gateway Response:     Successful (${ping.latencyMs}ms latency)`);
    if (isSimulated) {
      console.log(`⚠ Supplier Provider:   NOT CONFIGURED (Development Simulated Mode Active)`);
    } else {
      console.log(`✓ Supplier Provider:   CONNECTED (Real Upstream Provider Active)`);
    }
  } else {
    console.log(`! Model Request Status: ${ping.error}`);
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
    console.log('Cancelled.');
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
  console.log('Connect your AI developer tools in under a minute.\n');

  let apiKey = getApiKeyFromArgsOrEnv();

  if (!apiKey) {
    apiKey = await askQuestion('Enter your LightningDeals API Key (ld_live_...): ');
  }

  if (!apiKey) {
    console.log('✕ Setup cancelled: API key is required.');
    process.exit(1);
  }

  console.log(`\nValidating key ${maskString(apiKey)} with LightningDeals Gateway (${getGatewayUrl()})...`);
  const status = await validateApiKey(apiKey);

  if (!status.valid) {
    console.log(`✕ Validation Failed: ${status.error}`);
    process.exit(1);
  }

  console.log(`✓ API Key Verified! (${formatTokenCount(status.tokensRemaining)} Tokens Remaining)`);

  const clients = getClientTargets();
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
  const selectedClients = choice.toLowerCase() === 'n' ? [installedClients[0]] : installedClients;

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

  console.log('\nVerifying gateway connection...');
  const ping = await testApiRequest(apiKey);
  if (ping.success) {
    console.log(`✓ Gateway Verification Success (${ping.latencyMs}ms)!`);
  } else {
    console.log(`! Warning: Gateway verification ping failed (${ping.error}).`);
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

