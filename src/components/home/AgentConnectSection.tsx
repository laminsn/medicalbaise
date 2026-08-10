import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getBaiseAppKey, getBaiseAppUrl } from '@/lib/providerCommunication';
import { Check, Copy, Terminal } from 'lucide-react';

/**
 * "Connect your AI agents" — shipped as a labelled PREVIEW, not a live feature.
 *
 * `provider_ai_api_keys` mints SHA-256-hashed, scoped, expiring keys today, but
 * NOTHING verifies them: there is no API or MCP entry point in
 * supabase/functions/. A provider can generate a key, copy it once, and it opens
 * nothing.
 *
 * So this section must never imply the endpoint works. The config below is a
 * genuine preview of the intended shape — copyable, correct, and explicitly
 * marked as not yet active. When the verification middleware ships, the badge
 * and the notice come off and the host becomes real.
 *
 * Removing the "preview" framing before that endpoint exists would turn this
 * into a marketing promise with no wire behind it.
 */

const CLIENTS = ['Claude Desktop', 'Claude Code', 'ChatGPT', 'Codex', 'VS Code', 'Cursor'];

/**
 * `tone` exists because this section appears on two pages with different grounds:
 * /discover uses the app's light design tokens, while the Baise Hub landing at "/"
 * is a hardcoded dark surface (hsl(0 0% 7%)). Rendering the token-based light styling
 * on the dark page produced an obvious foreign block, so the chrome switches while
 * the terminal panel — already dark in both — stays put.
 */
export function AgentConnectSection({ tone = "light" }: { tone?: "light" | "dark" } = {}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState<string | null>(null);
  const isDark = tone === "dark";

  const styles = isDark
    ? {
        section: "py-16",
        sectionStyle: { borderTop: "1px solid hsl(0 0% 18%)" },
        heading: "text-white",
        body: "text-white/60",
        badge: "border-white/20 bg-white/5 text-white/70",
        chip: "border-white/15 bg-white/[0.03] text-white/70",
        label: "text-white/70",
      }
    : {
        section: "border-t bg-muted/30 py-16",
        sectionStyle: undefined,
        heading: "",
        body: "text-muted-foreground",
        badge: "",
        chip: "",
        label: "",
      };

  const appKey = getBaiseAppKey();
  const appUrl = getBaiseAppUrl();
  const serverName = `${appKey}-baise`;

  const snippets = useMemo(
    () => ({
      mcp: `{
  "mcpServers": {
    "${serverName}": {
      "url": "${appUrl}/mcp",
      "headers": {
        "Authorization": "Bearer baise_ai_YOUR_KEY_HERE"
      }
    }
  }
}`,
      // A route that actually exists in api-v1. An invented path here would be the
      // same defect this section exists to avoid, one level down: copyable, plausible,
      // and wrong. The pretty /api/v1 and /mcp hosts still need a rewrite in front of
      // the edge functions before the preview framing comes off (RESTORE-RUNBOOK §5l).
      api: `curl "${appUrl}/api/v1/providers/search?query=plumber&limit=5" \\
  -H "Authorization: Bearer baise_ai_YOUR_KEY_HERE"`,
    }),
    [appUrl, serverName],
  );

  const copy = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(id);
      window.setTimeout(() => setCopied((current) => (current === id ? null : current)), 2000);
    } catch {
      // Clipboard permission denied — the snippet is still selectable by hand.
    }
  };

  const renderSnippet = (id: string, value: string) => (
    <div className="relative rounded-lg border bg-zinc-950 p-4">
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="absolute right-3 top-3 h-8 gap-1.5"
        onClick={() => copy(id, value)}
      >
        {copied === id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied === id
          ? t('agentConnect.copied')
          : t('agentConnect.copy')}
      </Button>
      <pre className="overflow-x-auto pr-24 text-xs leading-relaxed text-zinc-100">
        <code>{value}</code>
      </pre>
    </div>
  );

  return (
    <section className={styles.section} style={styles.sectionStyle}>
      <div className="container mx-auto max-w-4xl px-4">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Terminal className="h-5 w-5 text-primary" />
          <h2 className={`text-2xl font-bold sm:text-3xl ${styles.heading}`}>{t('agentConnect.title')}</h2>
          <Badge variant="secondary" className={styles.badge}>{t('agentConnect.previewBadge')}</Badge>
        </div>

        <p className={`mb-4 ${styles.body}`}>{t('agentConnect.description')}</p>

        {/* The honesty gate. Do not remove until a verification endpoint exists. */}
        <div
          className="mb-8 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm"
          role="note"
        >
          {t('agentConnect.notLiveNotice')}
        </div>

        <Tabs defaultValue="mcp" className="mb-8">
          <TabsList>
            <TabsTrigger value="mcp">{t('agentConnect.tabMcp')}</TabsTrigger>
            <TabsTrigger value="api">{t('agentConnect.tabApi')}</TabsTrigger>
          </TabsList>
          <TabsContent value="mcp" className="mt-4 space-y-3">
            <p className={`text-sm ${styles.body}`}>{t('agentConnect.mcpHelp')}</p>
            {renderSnippet('mcp', snippets.mcp)}
          </TabsContent>
          <TabsContent value="api" className="mt-4 space-y-3">
            <p className={`text-sm ${styles.body}`}>{t('agentConnect.apiHelp')}</p>
            {renderSnippet('api', snippets.api)}
          </TabsContent>
        </Tabs>

        <div className="mb-8">
          <p className={`mb-3 text-sm font-medium ${styles.label}`}>{t('agentConnect.clientsTitle')}</p>
          <div className="flex flex-wrap gap-2">
            {CLIENTS.map((client) => (
              <Badge key={client} variant="outline" className={styles.chip}>
                {client}
              </Badge>
            ))}
          </div>
        </div>

        <Button asChild>
          <Link to="/integrations">{t('agentConnect.cta')}</Link>
        </Button>
      </div>
    </section>
  );
}
