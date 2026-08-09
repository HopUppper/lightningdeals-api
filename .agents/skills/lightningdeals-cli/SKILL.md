---
name: lightningdeals-cli
description: Package standards, automated client configuration, and cross-platform rules for the lightningdeals CLI.
---

# LightningDeals CLI Development Standards

## Customer Onboarding Flow

```text
npx lightningdeals
        ↓
Prompt for API key (ld_live_...)
        ↓
Validate key against LightningDeals API Gateway (/api/key-status)
        ↓
Detect installed AI clients (Claude Code, Cursor, Windsurf, Continue, VS Code)
        ↓
Prompt user to select target client(s)
        ↓
Backup existing configuration files (e.g. ~/.claude/settings.json.bak)
        ↓
Safely merge ANTHROPIC_BASE_URL and ANTHROPIC_AUTH_TOKEN
        ↓
Purge conflicting Bedrock / Vertex environment variables (CLAUDE_CODE_USE_BEDROCK, AWS_BEARER_TOKEN_BEDROCK)
        ↓
Perform live latency ping check
        ↓
Display configuration success summary
```

## Mandatory CLI Rules

1. **Cross-Platform Compatibility**: Must run flawlessly across Windows (PowerShell & CMD), macOS (zsh & bash), and Linux.
2. **Safe Merging**: Never overwrite unrelated user settings in `~/.claude/settings.json` or IDE config files.
3. **No Credential Leaks**: Never print raw API keys to terminal logs or error tracebacks.
