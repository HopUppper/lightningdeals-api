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
      id: 'codex',
      name: 'Codex',
      configPath: path.join(home, '.codex', 'settings.json'),
    },
    {
      id: 'cursor',
      name: 'Cursor',
      configPath: isWin
        ? path.join(appData, 'Cursor', 'User', 'settings.json')
        : path.join(home, 'Library', 'Application Support', 'Cursor', 'User', 'settings.json'),
    },
    {
      id: 'roo-code',
      name: 'Roo Code (VS Code)',
      configPath: path.join(home, '.roo', 'settings.json'),
    },
    {
      id: 'cline',
      name: 'Cline',
      configPath: path.join(home, '.cline', 'settings.json'),
    },
    {
      id: 'continue',
      name: 'Continue (VS Code)',
      configPath: path.join(home, '.continue', 'config.json'),
    },
    {
      id: 'trae-solo',
      name: 'TRAE SOLO',
      configPath: isWin
        ? path.join(appData, 'Trae', 'User', 'settings.json')
        : path.join(home, '.trae', 'settings.json'),
    },
    {
      id: 'claude-code',
      name: 'Claude Code',
      configPath: path.join(home, '.claude', 'settings.json'),
    },
    {
      id: 'opencode',
      name: 'OpenCode',
      configPath: path.join(home, '.opencode', 'config.json'),
    },
    {
      id: 'openclaw',
      name: 'OpenClaw',
      configPath: path.join(home, '.openclaw', 'config.json'),
    },
    {
      id: 'hermes',
      name: 'Hermes',
      configPath: path.join(home, '.hermes', 'config.json'),
    },
    {
      id: 'cherry-studio',
      name: 'Cherry Studio',
      configPath: isWin
        ? path.join(appData, 'CherryStudio', 'config.json')
        : path.join(home, '.cherrystudio', 'config.json'),
    },
    {
      id: 'api-code',
      name: 'API Code',
      configPath: path.join(home, '.apicode', 'config.json'),
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

    let updatedData: Record<string, any> = { ...existingData };

    if (client.id === 'claude-code') {
      const cleanEnv = { ...(existingData.env || {}) };
      
      // Remove Bedrock / Vertex overrides
      delete cleanEnv.CLAUDE_CODE_USE_BEDROCK;
      delete cleanEnv.CLAUDE_CODE_USE_VERTEX;
      delete cleanEnv.AWS_BEARER_TOKEN_BEDROCK;
      delete cleanEnv.AWS_REGION;
      delete cleanEnv.AWS_SECRET_ACCESS_KEY;
      delete cleanEnv.AWS_ACCESS_KEY_ID;

      // Delete legacy apiKeyHelper & helper settings to prevent Claude Code v2.1+ Auth conflict warnings
      delete updatedData.apiKeyHelper;
      delete updatedData.scalemax;

      cleanEnv.ANTHROPIC_BASE_URL = gatewayUrl;
      cleanEnv.ANTHROPIC_AUTH_TOKEN = apiKey;
      cleanEnv.ANTHROPIC_API_KEY = apiKey;

      updatedData.env = cleanEnv;

    } else if (client.id === 'cursor') {
      updatedData['cursor.cpp.overrideAnthropicApiKey'] = apiKey;
      updatedData['cursor.cpp.anthropicBaseUrl'] = gatewayUrl;
      updatedData['anthropic.apiKey'] = apiKey;
      updatedData['anthropic.baseUrl'] = gatewayUrl;
      updatedData['lightningdeals.apiKey'] = apiKey;
      updatedData['lightningdeals.baseUrl'] = gatewayUrl;

    } else if (client.id === 'roo-code' || client.id === 'cline') {
      updatedData['cline.apiKey'] = apiKey;
      updatedData['cline.baseUrl'] = gatewayUrl;
      updatedData['roo.apiKey'] = apiKey;
      updatedData['roo.baseUrl'] = gatewayUrl;
      updatedData['anthropic.apiKey'] = apiKey;
      updatedData['anthropic.baseUrl'] = gatewayUrl;
      updatedData['lightningdeals.apiKey'] = apiKey;
      updatedData['lightningdeals.baseUrl'] = gatewayUrl;

    } else if (client.id === 'continue') {
      const models = Array.isArray(existingData.models) ? [...existingData.models] : [];
      const modelIndex = models.findIndex((m: any) => m.title?.includes('LightningDeals') || m.apiBase?.includes('lightningapi.pro'));
      const ldModel = {
        title: 'Claude 3.5 Sonnet (LightningDeals)',
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        apiKey: apiKey,
        apiBase: gatewayUrl,
      };

      if (modelIndex !== -1) {
        models[modelIndex] = ldModel;
      } else {
        models.unshift(ldModel);
      }
      updatedData.models = models;
      updatedData.tabAutocompleteModel = {
        title: 'Claude 3.5 Haiku Autocomplete (LightningDeals)',
        provider: 'anthropic',
        model: 'claude-3-5-haiku-20241022',
        apiKey: apiKey,
        apiBase: gatewayUrl,
      };

    } else if (client.id === 'trae-solo') {
      updatedData['trae.anthropicApiKey'] = apiKey;
      updatedData['trae.anthropicBaseUrl'] = gatewayUrl;
      updatedData['anthropic.apiKey'] = apiKey;
      updatedData['anthropic.baseUrl'] = gatewayUrl;
      updatedData['lightningdeals.apiKey'] = apiKey;
      updatedData['lightningdeals.baseUrl'] = gatewayUrl;

    } else {
      // General tools (Codex, OpenCode, OpenClaw, Hermes, Cherry Studio, API Code)
      updatedData['apiKey'] = apiKey;
      updatedData['baseUrl'] = gatewayUrl;
      updatedData['apiProvider'] = 'anthropic';
      updatedData['lightningdeals.apiKey'] = apiKey;
      updatedData['lightningdeals.baseUrl'] = gatewayUrl;
      updatedData['anthropic.apiKey'] = apiKey;
      updatedData['anthropic.baseUrl'] = gatewayUrl;
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
      delete data['cursor.cpp.overrideAnthropicApiKey'];
      delete data['cursor.cpp.anthropicBaseUrl'];
      delete data['cline.apiKey'];
      delete data['cline.baseUrl'];
      delete data['roo.apiKey'];
      delete data['roo.baseUrl'];
      delete data['trae.anthropicApiKey'];
      delete data['trae.anthropicBaseUrl'];

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
