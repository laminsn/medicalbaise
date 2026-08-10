import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getBaiseAppKey, getBaiseAppUrl } from '@/lib/providerCommunication';
import { CalendarCheck, Check, Copy, Search, Sparkles, Workflow } from 'lucide-react';

/**
 * "Connect your agents" — a sales surface for the MCP + API capability.
 *
 * Shipped as a labelled PREVIEW, and that framing is load-bearing.
 * `provider_ai_api_keys` mints SHA-256-hashed, scoped, expiring keys today; the
 * verifier, api-v1 and mcp-server are written but the Supabase project is paused,
 * so nothing has ever accepted a key. The notice comes off when RESTORE-RUNBOOK
 * §5l passes — not before. Removing it early turns this into a promise with no
 * wire behind it.
 *
 * Layout: benefits on the left, a computer-screen mockup on the right. The screen
 * is the product demo; the left column is what it is FOR.
 */

const CLIENTS = ['Claude', 'ChatGPT', 'Codex', 'VS Code', 'Cursor'];

const BENEFITS = [
  { icon: CalendarCheck, key: 'bookings' },
  { icon: Search, key: 'findProviders' },
  { icon: Workflow, key: 'routing' },
  { icon: Sparkles, key: 'anywhere' },
] as const;

export function AgentConnectSection({ tone = 'light' }: { tone?: 'light' | 'dark' } = {}) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'mcp' | 'api'>('mcp');
  const [copied, setCopied] = useState(false);
  const isDark = tone === 'dark';

  const s = isDark
    ? {
        section: 'py-14 md:py-16',
        sectionStyle: { borderTop: '1px solid hsl(0 0% 18%)' },
        eyebrow: 'text-primary',
        heading: 'text-white',
        lead: 'text-white/70',
        body: 'text-white/55',
        benefitTitle: 'text-white',
        chip: 'border-white/15 bg-white/[0.03] text-white/60',
        note: 'text-white/45',
        screenBorder: 'border-white/10',
      }
    : {
        section: 'border-t bg-muted/30 py-14 md:py-16',
        sectionStyle: undefined,
        eyebrow: 'text-primary',
        heading: '',
        lead: 'text-muted-foreground',
        body: 'text-muted-foreground',
        benefitTitle: '',
        chip: '',
        note: 'text-muted-foreground',
        screenBorder: 'border-border',
      };

  const appKey = getBaiseAppKey();
  const appUrl = getBaiseAppUrl();

  const mcpSnippet = useMemo(
    () => `{
  "mcpServers": {
    "${appKey}-baise": {
      "url": "${appUrl}/mcp",
      "headers": {
        "Authorization": "Bearer baise_ai_YOUR_KEY"
      }
    }
  }
}`,
    [appKey, appUrl],
  );

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(mcpSnippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — the snippet is still selectable by hand.
    }
  };

  const tabClass = (value: 'mcp' | 'api') =>
    `rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
      tab === value ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white/70'
    }`;

  return (
    <section className={s.section} style={s.sectionStyle}>
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          {/* Left — what it is for */}
          <div>
            <p className={`mb-3 text-[10.5px] font-bold uppercase tracking-[0.18em] ${s.eyebrow}`}>
              {t('agentConnect.eyebrow')}
            </p>

            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h2 className={`text-2xl font-bold tracking-tight sm:text-3xl ${s.heading}`}>
                {t('agentConnect.title')}
              </h2>
              <Badge variant="secondary" className={s.chip}>
                {t('agentConnect.previewBadge')}
              </Badge>
            </div>

            <p className={`mb-6 text-base ${s.lead}`}>{t('agentConnect.lead')}</p>

            <ul className="mb-7 space-y-4">
              {BENEFITS.map(({ icon: Icon, key }) => (
                <li key={key} className="flex gap-3">
                  <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <p className={`text-sm font-semibold ${s.benefitTitle}`}>
                      {t(`agentConnect.benefits.${key}.title`)}
                    </p>
                    <p className={`text-sm ${s.body}`}>{t(`agentConnect.benefits.${key}.body`)}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link to="/auth?mode=signup">{t('agentConnect.primaryCta')}</Link>
              </Button>
              <span className={`text-xs ${s.note}`}>{t('agentConnect.notLiveNotice')}</span>
            </div>
          </div>

          {/* Right — the screen */}
          <div className={`overflow-hidden rounded-xl border ${s.screenBorder} bg-zinc-950 shadow-2xl`}>
            {/* Window chrome. Decorative, so it is hidden from assistive tech. */}
            <div
              className="flex items-center gap-2 border-b border-white/10 px-4 py-3"
              aria-hidden="true"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              <span className="ml-2 font-mono text-[11px] text-white/35">
                {appKey}-baise · agent setup
              </span>
            </div>

            <div className="flex items-center gap-1 border-b border-white/10 px-3 py-2">
              <button type="button" className={tabClass('mcp')} onClick={() => setTab('mcp')}>
                {t('agentConnect.tabMcp')}
              </button>
              <button type="button" className={tabClass('api')} onClick={() => setTab('api')}>
                {t('agentConnect.tabApi')}
              </button>
            </div>

            {tab === 'mcp' ? (
              <div className="p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-white/45">{t('agentConnect.mcpHelp')}</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-7 shrink-0 gap-1.5 text-xs"
                    onClick={copySnippet}
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? t('agentConnect.copied') : t('agentConnect.copy')}
                  </Button>
                </div>
                <pre className="overflow-x-auto font-mono text-[11.5px] leading-relaxed text-zinc-100">
                  <code>{mcpSnippet}</code>
                </pre>
              </div>
            ) : (
              // The API tab is deliberately NOT a snippet. A key comes from an
              // account, so showing a curl line the reader cannot run yet would
              // put the instruction before the thing it needs.
              <div className="space-y-4 p-5">
                <p className="text-sm text-white/70">{t('agentConnect.apiBody')}</p>
                <p className="text-xs text-white/45">{t('agentConnect.apiScopes')}</p>
                <Button asChild size="sm" className="w-full">
                  <Link to="/auth?mode=signup">{t('agentConnect.apiCta')}</Link>
                </Button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-1.5 border-t border-white/10 px-4 py-3">
              <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-white/30">
                {t('agentConnect.clientsTitle')}
              </span>
              {CLIENTS.map((client) => (
                <span
                  key={client}
                  className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white/50"
                >
                  {client}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
