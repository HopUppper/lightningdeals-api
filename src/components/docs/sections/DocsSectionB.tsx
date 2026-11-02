import React from 'react';
import {
  Terminal,
  Sparkles,
  Settings,
  CheckCircle2,
  RefreshCw,
  Trash2,
  ShieldCheck,
  Code,
} from 'lucide-react';
import { MultiOsCodeBlock } from '../MultiOsCodeBlock';

export const DocsSectionB: React.FC = () => {
  return (
    <section id="sec-quick-setup" className="space-y-8 pt-4">
      <div className="border-b border-[#ede8e1] pb-3">
        <span className="text-xs font-bold text-violet-700 uppercase tracking-widest font-mono">
          Section B
        </span>
        <h2 className="text-2xl font-bold text-[#1c1917] tracking-tight">
          Quick Setup &amp; Environment Configuration
        </h2>
      </div>

      {/* B1: Windows Setup */}
      <article
        id="windows-setup"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <Terminal className="w-5 h-5 text-blue-600" />
          <span>1. Windows Setup (PowerShell &amp; Command Prompt)</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          In Windows PowerShell (run as Administrator for persistent user-wide variables), set your environment variables so tools like Claude Code and Codex can automatically authenticate:
        </p>
        <MultiOsCodeBlock
          title="Windows Persistent Setup"
          tabs={[
            {
              label: 'PowerShell (Current Session)',
              language: 'powershell',
              code: `$env:ANTHROPIC_BASE_URL="https://lightningapi.pro"
$env:ANTHROPIC_AUTH_TOKEN="ld_live_your_api_key_here"
$env:OPENAI_BASE_URL="https://lightningapi.pro/v1"
$env:OPENAI_API_KEY="ld_live_your_api_key_here"`,
            },
            {
              label: 'PowerShell (Persistent User-Wide)',
              language: 'powershell',
              code: `[Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", "https://lightningapi.pro", "User")
[Environment]::SetEnvironmentVariable("ANTHROPIC_AUTH_TOKEN", "ld_live_your_api_key_here", "User")
[Environment]::SetEnvironmentVariable("OPENAI_BASE_URL", "https://lightningapi.pro/v1", "User")
[Environment]::SetEnvironmentVariable("OPENAI_API_KEY", "ld_live_your_api_key_here", "User")`,
            },
            {
              label: 'PowerShell Profile ($PROFILE)',
              language: 'powershell',
              code: `if (!(Test-Path -Path $PROFILE)) { New-Item -ItemType File -Path $PROFILE -Force }
Add-Content -Path $PROFILE -Value '$env:ANTHROPIC_BASE_URL="https://lightningapi.pro"'
Add-Content -Path $PROFILE -Value '$env:ANTHROPIC_AUTH_TOKEN="ld_live_your_api_key_here"'
Add-Content -Path $PROFILE -Value '$env:OPENAI_BASE_URL="https://lightningapi.pro/v1"'
Add-Content -Path $PROFILE -Value '$env:OPENAI_API_KEY="ld_live_your_api_key_here"'`,
            },
          ]}
        />
      </article>

      {/* B2: macOS Setup */}
      <article
        id="macos-setup"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <Terminal className="w-5 h-5 text-purple-600" />
          <span>2. macOS Setup (Terminal &amp; Zsh)</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          On macOS (default Zsh shell), append your environment variables to{' '}
          <code className="font-mono text-xs bg-stone-100 px-1 py-0.5 rounded">~/.zshrc</code> and reload your session:
        </p>
        <MultiOsCodeBlock
          title="macOS Persistent Setup (~/.zshrc)"
          tabs={[
            {
              label: 'macOS Zsh (~/.zshrc)',
              language: 'bash',
              code: `echo 'export ANTHROPIC_BASE_URL="https://lightningapi.pro"' >> ~/.zshrc
echo 'export ANTHROPIC_AUTH_TOKEN="ld_live_your_api_key_here"' >> ~/.zshrc
echo 'export OPENAI_BASE_URL="https://lightningapi.pro/v1"' >> ~/.zshrc
echo 'export OPENAI_API_KEY="ld_live_your_api_key_here"' >> ~/.zshrc
source ~/.zshrc`,
            },
            {
              label: 'macOS Bash (~/.bash_profile)',
              language: 'bash',
              code: `echo 'export ANTHROPIC_BASE_URL="https://lightningapi.pro"' >> ~/.bash_profile
echo 'export ANTHROPIC_AUTH_TOKEN="ld_live_your_api_key_here"' >> ~/.bash_profile
echo 'export OPENAI_BASE_URL="https://lightningapi.pro/v1"' >> ~/.bash_profile
echo 'export OPENAI_API_KEY="ld_live_your_api_key_here"' >> ~/.bash_profile
source ~/.bash_profile`,
            },
          ]}
        />
      </article>

      {/* B3: Linux Setup */}
      <article
        id="linux-setup"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-600" />
          <span>3. Linux Setup (Ubuntu / Debian / Fedora / Arch)</span>
        </h3>
        <MultiOsCodeBlock
          title="Linux Persistent Setup (~/.bashrc)"
          tabs={[
            {
              label: 'Linux Bash (~/.bashrc)',
              language: 'bash',
              code: `echo 'export ANTHROPIC_BASE_URL="https://lightningapi.pro"' >> ~/.bashrc
echo 'export ANTHROPIC_AUTH_TOKEN="ld_live_your_api_key_here"' >> ~/.bashrc
echo 'export OPENAI_BASE_URL="https://lightningapi.pro/v1"' >> ~/.bashrc
echo 'export OPENAI_API_KEY="ld_live_your_api_key_here"' >> ~/.bashrc
source ~/.bashrc`,
            },
            {
              label: 'System-wide (/etc/environment)',
              language: 'bash',
              code: `sudo tee -a /etc/environment << EOF
ANTHROPIC_BASE_URL="https://lightningapi.pro"
ANTHROPIC_AUTH_TOKEN="ld_live_your_api_key_here"
OPENAI_BASE_URL="https://lightningapi.pro/v1"
OPENAI_API_KEY="ld_live_your_api_key_here"
EOF`,
            },
          ]}
        />
      </article>

      {/* B4: Automatic setup */}
      <article
        id="automatic-setup"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-600" />
          <span>4. Automatic Setup (1-Command CLI Installer)</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          LightningAPI provides a one-command interactive setup tool that auto-detects installed coding editors, creates configuration backups, injects endpoints, and tests connectivity in seconds:
        </p>
        <MultiOsCodeBlock
          title="1-Command CLI Installer"
          tabs={[
            {
              label: 'Universal NPX',
              language: 'bash',
              code: `npx lightningdeals`,
            },
            {
              label: 'macOS / Linux Shell',
              language: 'bash',
              code: `curl -fsSL https://lightningapi.pro/setup.sh | bash`,
            },
            {
              label: 'Windows PowerShell',
              language: 'powershell',
              code: `irm https://lightningapi.pro/setup.ps1 | iex`,
            },
          ]}
        />
      </article>

      {/* B5: Manual Configuration */}
      <article
        id="manual-setup"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <Settings className="w-5 h-5 text-violet-600" />
          <span>5. Manual Configuration Best Practices</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          If you prefer manual configuration over the automated CLI, ensure you configure both the Anthropic and OpenAI compatible endpoints in your editor settings files:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#ede8e1] bg-[#faf8f5] text-[10px] font-bold uppercase text-[#78716c]">
                <th className="py-2.5 px-3">Variable Name</th>
                <th className="py-2.5 px-3">Target Value</th>
                <th className="py-2.5 px-3">Used By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ede8e1]">
              <tr>
                <td className="py-2.5 px-3 font-bold text-violet-700">ANTHROPIC_BASE_URL</td>
                <td className="py-2.5 px-3 text-[#1c1917]">https://lightningapi.pro</td>
                <td className="py-2.5 px-3 text-[#78716c]">Claude Code, Cursor, Cline, Roo Code</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-violet-700">ANTHROPIC_AUTH_TOKEN</td>
                <td className="py-2.5 px-3 text-[#1c1917]">ld_live_your_key_here</td>
                <td className="py-2.5 px-3 text-[#78716c]">Claude Code CLI</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-blue-700">OPENAI_BASE_URL</td>
                <td className="py-2.5 px-3 text-[#1c1917]">https://lightningapi.pro/v1</td>
                <td className="py-2.5 px-3 text-[#78716c]">Codex, Windsurf, TRAE, OpenAI SDK</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-blue-700">OPENAI_API_KEY</td>
                <td className="py-2.5 px-3 text-[#1c1917]">ld_live_your_key_here</td>
                <td className="py-2.5 px-3 text-[#78716c]">OpenAI Compatible Tools</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      {/* B6: Verifying Installation */}
      <article
        id="verify-installation"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>6. Verifying Installation &amp; Connectivity</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          Verify that your environment variables are active and that your API key connects successfully by requesting your authorized models:
        </p>
        <MultiOsCodeBlock
          title="Test Gateway Verification"
          tabs={[
            {
              label: 'macOS / Linux Terminal',
              language: 'bash',
              code: `curl -s https://lightningapi.pro/v1/models \\
  -H "Authorization: Bearer $OPENAI_API_KEY" | grep -o '"id": "[^"]*"'`,
            },
            {
              label: 'Windows PowerShell',
              language: 'powershell',
              code: `curl.exe -s https://lightningapi.pro/v1/models -H "Authorization: Bearer $env:OPENAI_API_KEY"`,
            },
          ]}
        />
        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>If the response lists models such as <code className="font-mono font-bold">claude-sonnet-5.5</code> and <code className="font-mono font-bold">gpt-4o</code>, your environment is ready.</span>
        </div>
      </article>

      {/* B7: Changing / Rotating Keys */}
      <article
        id="rotate-key"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-violet-600" />
          <span>7. Changing or Rotating Your API Key</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          When upgrading your plan, rotating keys for security, or replacing an old key, update your active key in place without reinstalling tools:
        </p>
        <ol className="space-y-2 text-xs text-[#44403c] list-decimal list-inside leading-relaxed">
          <li>Generate a new key in <strong className="text-[#1c1917]">Dashboard → API Keys</strong>.</li>
          <li>In your terminal or PowerShell profile, replace the old <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">ld_live_...</code> string with your new key.</li>
          <li>In Cursor, open <strong className="text-[#1c1917]">Settings → Models</strong> and paste the new key into the Anthropic API Key input.</li>
          <li>In Claude Code, edit <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">~/.claude/settings.json</code> and update <code className="font-mono">ANTHROPIC_AUTH_TOKEN</code>.</li>
        </ol>
      </article>

      {/* B8: Removing Configurations */}
      <article
        id="remove-config"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-rose-600" />
          <span>8. Removing Configurations &amp; Clean Reset</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          To completely remove LightningAPI environment variables and revert your tools back to default cloud endpoints:
        </p>
        <MultiOsCodeBlock
          title="Clean Reset Commands"
          tabs={[
            {
              label: 'macOS / Linux Shell',
              language: 'bash',
              code: `# Unset for current session:
unset ANTHROPIC_BASE_URL ANTHROPIC_AUTH_TOKEN OPENAI_BASE_URL OPENAI_API_KEY

# Remove from ~/.zshrc or ~/.bashrc:
sed -i '' '/lightningapi/d' ~/.zshrc 2>/dev/null || sed -i '/lightningapi/d' ~/.bashrc 2>/dev/null`,
            },
            {
              label: 'Windows PowerShell',
              language: 'powershell',
              code: `# Remove user-wide environment variables:
[Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", $null, "User")
[Environment]::SetEnvironmentVariable("ANTHROPIC_AUTH_TOKEN", $null, "User")
[Environment]::SetEnvironmentVariable("OPENAI_BASE_URL", $null, "User")
[Environment]::SetEnvironmentVariable("OPENAI_API_KEY", $null, "User")`,
            },
          ]}
        />
      </article>
    </section>
  );
};
