# ⚡ LightningDeals CLI

Official one-command setup CLI for **LightningDeals AI API Gateway**. Automatically configures Claude Code, Cursor IDE, Windsurf, VS Code, Cline, and Roo Code to route requests through LightningDeals prepaid token balances.

## Quick Start

Get up and running in under a minute:

```bash
npx lightningdeals
```

### Non-Interactive Setup

```bash
npx lightningdeals --key "ld_live_your_assigned_api_key_here"
```

## Features

- ⚡ **One-Command Setup**: Automatically detects installed IDEs and AI coding tools and configures environment variables.
- 🔐 **Safe Configuration Merging**: Creates `.lightningdeals.backup` files before modifying any configuration, preserving all existing user settings.
- 🩺 **Built-in Diagnostics**: Run `npx lightningdeals doctor` to test key validity, token balances, latency, and client configurations.
- 🎯 **Cross-Platform**: Supports Windows (PowerShell & CMD), macOS (zsh & bash), and Linux.

## Available Commands

| Command | Description |
| :--- | :--- |
| `npx lightningdeals` | Interactive setup wizard |
| `npx lightningdeals doctor` | Runs complete health & connection diagnostics |
| `npx lightningdeals models` | Lists live available LLM models |
| `npx lightningdeals status` | Shows key balance, purchased tokens, and expiry |
| `npx lightningdeals remove` | Safely removes LightningDeals config and restores backups |

## License

MIT © LightningDeals Engineering
