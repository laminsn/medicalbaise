import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { getBaiseAppKey, getBaiseAppUrl } from '@/lib/providerCommunication';

/**
 * /developers — the MCP + API guide.
 *
 * Public and unauthenticated on purpose: a developer evaluating whether to build
 * against this should not have to create an account to read what it does.
 *
 * COMING SOON is load-bearing on this page. api-v1 and mcp-server are written and
 * committed but the Supabase project is paused, so no key has ever been accepted.
 * Every claim here is written in the present tense about capability and the future
 * tense about availability. When RESTORE-RUNBOOK §5l passes, the notice comes off
 * and the tense changes — not before.
 *
 * No icon set. The page is typographic by design.
 */

const CLIENTS = [
  { name: 'Claude Desktop', transport: 'MCP' },
  { name: 'Claude Code', transport: 'MCP' },
  { name: 'ChatGPT', transport: 'MCP' },
  { name: 'Codex', transport: 'MCP' },
  { name: 'VS Code', transport: 'MCP' },
  { name: 'Cursor', transport: 'MCP' },
  { name: 'Anything else', transport: 'REST' },
];

const TOOLS = [
  { name: 'search_providers', scope: 'providers:read' },
  { name: 'get_provider', scope: 'providers:read' },
  { name: 'list_requests', scope: 'requests:read' },
  { name: 'create_request', scope: 'requests:write' },
  { name: 'list_invitations', scope: 'requests:read' },
  { name: 'respond_to_invitation', scope: 'requests:write' },
  { name: 'list_services', scope: 'services:read' },
  { name: 'update_service', scope: 'services:write' },
];

const STEPS = ['account', 'key', 'connect', 'work'] as const;

export default function Developers() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const appKey = getBaiseAppKey();
  const appUrl = getBaiseAppUrl();

  const snippet = useMemo(
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
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — the snippet is still selectable by hand.
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('developers.metaTitle')}</title>
        <meta name="description" content={t('developers.metaDescription')} />
      </Helmet>

      <main className="min-h-screen bg-background">
        {/* Header */}
        <section className="border-b px-4 py-16 sm:px-6 md:py-20">
          <div className="mx-auto max-w-5xl">
            <p className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.18em] text-primary">
              {t('developers.eyebrow')}
            </p>
            <h1 className="mb-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              {t('developers.title')}
            </h1>
            <p className="mb-6 max-w-2xl text-lg text-muted-foreground">
              {t('developers.subtitle')}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link to="/auth?mode=signup">{t('developers.cta')}</Link>
              </Button>
              <span className="rounded border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-medium">
                {t('developers.comingSoon')}
              </span>
            </div>
          </div>
        </section>

        {/* What MCP is */}
        <section className="border-b px-4 py-14 sm:px-6">
          <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
            <div>
              <h2 className="mb-3 text-2xl font-bold tracking-tight">
                {t('developers.whatMcp.title')}
              </h2>
              <p className="mb-4 text-muted-foreground">{t('developers.whatMcp.body')}</p>
              <p className="text-muted-foreground">{t('developers.whatMcp.body2')}</p>
            </div>

            <div className="overflow-hidden rounded-xl border bg-zinc-950 shadow-xl">
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                <span className="ml-2 font-mono text-[11px] text-white/35">
                  claude_desktop_config.json
                </span>
              </div>
              <div className="p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-white/45">{t('developers.snippetHelp')}</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-7 shrink-0 text-xs"
                    onClick={copySnippet}
                  >
                    {copied ? t('developers.copied') : t('developers.copy')}
                  </Button>
                </div>
                <pre className="overflow-x-auto font-mono text-[11.5px] leading-relaxed text-zinc-100">
                  <code>{snippet}</code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Clients */}
        <section className="border-b px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-2 text-2xl font-bold tracking-tight">
              {t('developers.clients.title')}
            </h2>
            <p className="mb-7 max-w-2xl text-muted-foreground">{t('developers.clients.body')}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {CLIENTS.map((client) => (
                <div key={client.name} className="rounded-lg border px-4 py-3">
                  <p className="text-sm font-semibold">{client.name}</p>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    {client.transport}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-b px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-7 text-2xl font-bold tracking-tight">
              {t('developers.how.title')}
            </h2>
            {/* Numbered because this genuinely is a sequence — each step needs the one above it. */}
            <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, index) => (
                <li key={step}>
                  <p className="mb-2 font-mono text-xs text-primary">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <p className="mb-1 font-semibold">{t(`developers.how.${step}.title`)}</p>
                  <p className="text-sm text-muted-foreground">{t(`developers.how.${step}.body`)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Tools */}
        <section className="border-b px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-2 text-2xl font-bold tracking-tight">
              {t('developers.tools.title')}
            </h2>
            <p className="mb-7 max-w-2xl text-muted-foreground">{t('developers.tools.body')}</p>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-2.5 text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {t('developers.tools.colTool')}
                    </th>
                    <th className="px-4 py-2.5 text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {t('developers.tools.colScope')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {TOOLS.map((tool) => (
                    <tr key={tool.name} className="border-b last:border-0">
                      <td className="px-4 py-2.5 font-mono text-[12.5px]">{tool.name}</td>
                      <td className="px-4 py-2.5 font-mono text-[12.5px] text-muted-foreground">
                        {tool.scope}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{t('developers.tools.note')}</p>
          </div>
        </section>

        {/* Security */}
        <section className="border-b px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-2 text-2xl font-bold tracking-tight">
              {t('developers.security.title')}
            </h2>
            <p className="mb-6 max-w-2xl text-muted-foreground">{t('developers.security.body')}</p>
            <ul className="grid gap-4 sm:grid-cols-2">
              {(['scoped', 'expiring', 'revocable', 'isolated'] as const).map((item) => (
                <li key={item} className="border-l-2 border-primary/60 pl-4">
                  <p className="text-sm font-semibold">{t(`developers.security.${item}.title`)}</p>
                  <p className="text-sm text-muted-foreground">
                    {t(`developers.security.${item}.body`)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Close */}
        <section className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-3 text-2xl font-bold tracking-tight">
              {t('developers.close.title')}
            </h2>
            <p className="mb-6 max-w-2xl text-muted-foreground">{t('developers.close.body')}</p>
            <Button asChild size="lg">
              <Link to="/auth?mode=signup">{t('developers.cta')}</Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  );
}
