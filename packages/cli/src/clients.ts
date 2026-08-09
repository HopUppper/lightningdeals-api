import fs from 'fs';
import path from 'path';
import os from 'os';

export interface ClientTarget {
  id: string;
  name: string;
  configPath: string;
  installed: boolean;
  configured: boolean;
  existingApiKey?: string;
}

const getHomeDir = (): string => os.homedir();

export const getClientTargets = (): ClientTarget[] => {
  const home = getHomeDir();
  const isWin = process.platform === 'win32';
  const appData = process.env.APPDATA || (isWin ? path.join(home, 'AppData', 'Roaming') : path.join(home, '.config'));

  const targets = [
    {
      id: 'claude-code',
      name: 'Claude Code CLI',
      configPath: path.join(home, '.claude', 'settings.json'),
    },
    {
      id: 'cursor',
      name: 'Cursor IDE',
      configPath: isWin
        ? path.join(appData, 'Cursor', 'User', 'settings.json')
        : path.join(home, 'Library', 'Application Support', 'Cursor', 'User', 'settings.json'),
    },
    {
      id: 'windsurf',
      name: 'Windsurf Editor',
      configPath: isWin
        ? path.join(appData, 'Windsurf', 'User', 'settings.json')
        : path.join(home, '.codeium', 'windsurf', 'settings.json'),
    },
    {
      id: 'vscode',
      name: 'VS Code',
      configPath: isWin
        ? path.join(appData, 'Code', 'User', 'settings.json')
        : path.join(home, 'Library', 'Application Support', 'Code', 'User', 'settings.json'),
    },
    {
      id: 'cline',
      name: 'Cline (VS Code Extension)',
      configPath: path.join(home, '.cline', 'settings.json'),
    },
    {
      id: 'roo-code',
      name: 'Roo Code',
      configPath: path.join(home, '.roo', 'settings.json'),
    },
  ];

  return targets.map((t) => {
    const parentDir = path.dirname(t.configPath);
    const installed = fs.existsSync(parentDir) || fs.existsSync(t.configPath);
    let configured = false;
    let existingApiKey: string | undefined = undefined;

    if (fs.existsSync(t.configPath)) {
      try {
        const raw = fs.readFileSync(t.configPath, 'utf8');
        configured = raw.includes('lightningdeals') || raw.includes('ANTHROPIC_BASE_URL') || raw.includes('ld_live_') || raw.includes('lightningapi.pro');
        const match = raw.match(/ld_(live|trial)_[a-zA-Z0-9]+/);
        if (match) {
          existingApiKey = match[0];
        }
      } catch (e) {
        configured = false;
      }
    }

    return {
      ...t,
      installed,
      configured,
      existingApiKey,
    };
  });
};


export const configureClient = (
  client: ClientTarget,
  apiKey: string,
  gatewayUrl: string = 'https://lightningapi.pro'
): { success: boolean; backupPath?: string; error?: string } => {




  try {
    const dir = path.dirname(client.configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let existingData: Record<string, any> = {};
    let backupPath: string | undefined;

    if (fs.existsSync(client.configPath)) {
      try {
        const raw = fs.readFileSync(client.configPath, 'utf8');
        existingData = JSON.parse(raw);
      } catch (e) {
        existingData = {};
      }

      // Safe Backup before modifying
      backupPath = `${client.configPath}.lightningdeals.backup`;
      fs.copyFileSync(client.configPath, backupPath);
    }

    // Merge LightningDeals settings safely without deleting existing fields
    let updatedData: Record<string, any> = { ...existingData };

    if (client.id === 'claude-code') {
      const cleanEnv = { ...(existingData.env || {}) };
      
      // CRITICAL: Remove Bedrock / Vertex overrides so Claude Code uses LightningDeals Anthropic API Gateway
      delete cleanEnv.CLAUDE_CODE_USE_BEDROCK;
      delete cleanEnv.CLAUDE_CODE_USE_VERTEX;
      delete cleanEnv.AWS_BEARER_TOKEN_BEDROCK;
      delete cleanEnv.AWS_REGION;
      delete cleanEnv.AWS_SECRET_ACCESS_KEY;
      delete cleanEnv.AWS_ACCESS_KEY_ID;

      cleanEnv.ANTHROPIC_BASE_URL = gatewayUrl;
      cleanEnv.ANTHROPIC_AUTH_TOKEN = apiKey;
      cleanEnv.ANTHROPIC_API_KEY = apiKey;

      updatedData.env = cleanEnv;
    } else {
      updatedData['lightningdeals.apiKey'] = apiKey;
      updatedData['lightningdeals.baseUrl'] = gatewayUrl;
      updatedData['anthropic.baseUrl'] = gatewayUrl;
      updatedData['anthropic.apiKey'] = apiKey;
    }

    fs.writeFileSync(client.configPath, JSON.stringify(updatedData, null, 2), 'utf8');
    return { success: true, backupPath };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

export const removeClientConfiguration = (client: ClientTarget): { success: boolean; restored: boolean } => {
  try {
    const backupPath = `${client.configPath}.lightningdeals.backup`;
    let restored = false;

    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, client.configPath);
      fs.unlinkSync(backupPath);
      restored = true;
    } else if (fs.existsSync(client.configPath)) {
      const raw = fs.readFileSync(client.configPath, 'utf8');
      const data = JSON.parse(raw);

      delete data['lightningdeals.apiKey'];
      delete data['lightningdeals.baseUrl'];
      delete data['anthropic.baseUrl'];
      delete data['anthropic.apiKey'];

      if (data.env) {
        delete data.env.ANTHROPIC_BASE_URL;
        delete data.env.ANTHROPIC_AUTH_TOKEN;
        delete data.env.ANTHROPIC_API_KEY;
      }

      fs.writeFileSync(client.configPath, JSON.stringify(data, null, 2), 'utf8');
    }

    return { success: true, restored };
  } catch (e) {
    return { success: false, restored: false };
  }
};
