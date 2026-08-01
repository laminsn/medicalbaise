import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertTriangle, Check, ClipboardCopy, KeyRound, Loader2, RefreshCw, Ban, TimerOff,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { getBaiseAppKey } from '@/lib/providerCommunication';

const db = supabase as any;

const APP_LABEL: Record<string, string> = {
  casa: 'Casa', medical: 'Medical', legal: 'Legal',
};

type Campaign = { id: string; app_key: string; name: string; max_redemptions: number | null; current_redemptions: number };
type Application = {
  id: string; app_key: string; full_name: string; email: string; phone: string | null;
  city: string | null; intended_role: string; profession: string | null;
  years_experience: number | null; device: string | null; motivation: string | null;
  status: string; created_at: string; invite_id: string | null;
  consent_version: string | null; consented_at: string | null;
  signature_data_url: string | null;
  email_confirmed_at: string | null;
};
type Invite = {
  id: string; app_key: string; label: string; intended_role: string; granted_tier: string | null;
  code_last4: string; status: string; grant_days: number; grant_expires_at: string | null;
  claimed_by: string | null; claimed_at: string | null; created_at: string;
};
type IssueReport = {
  id: string; app_key: string; severity: string; area: string; title: string; body: string;
  page_url: string | null; status: string; created_at: string; attachments: unknown;
};
/** Plaintext codes exist only in this array, only until the page is closed. */
type MintedCode = { invite_id: string; label: string; code: string; app_key: string };

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }) : '—';

/**
 * Pilot cohort console.
 *
 * Everything the pilot needs existed as RPCs and tables but had no surface, so
 * running it meant opening psql. This is that surface: review who applied,
 * issue a code, watch the roster, triage what testers report, and end the
 * pilot. Admin-gated in the UI for clarity; the real gate is server-side in
 * each RPC and in RLS.
 */
export function AdminPilotCohort() {
  const currentApp = getBaiseAppKey();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [minted, setMinted] = useState<MintedCode[]>([]);
  const [scope, setScope] = useState<string>(currentApp);

  // Manual issuance, for testers who did not come through the form.
  const [mLabel, setMLabel] = useState('');
  const [mRole, setMRole] = useState('provider');
  const [mTier, setMTier] = useState('enterprise');
  const [mDays, setMDays] = useState('60');

  const load = useCallback(async () => {
    const [c, a, i, r] = await Promise.all([
      db.from('promotional_campaigns').select('id,app_key,name,max_redemptions,current_redemptions'),
      db.from('pilot_applications').select('*').order('created_at', { ascending: false }).limit(200),
      db.from('test_cohort_invites').select('*').order('created_at', { ascending: false }).limit(200),
      db.from('pilot_issue_reports').select('*').order('created_at', { ascending: false }).limit(200),
    ]);
    if (c.data) setCampaigns(c.data as Campaign[]);
    if (a.data) setApps(a.data as Application[]);
    if (i.data) setInvites(i.data as Invite[]);
    if (r.data) setIssues(r.data as IssueReport[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Memoised on `scope` so the three lists below only recompute when the filter
  // actually changes, rather than on every render.
  const inScope = useCallback(
    <T extends { app_key: string }>(rows: T[]) =>
      scope === 'all' ? rows : rows.filter((row) => row.app_key === scope),
    [scope],
  );

  // Valid statuses are new|shortlisted|invited|signed|declined|withdrawn.
  // Awaiting review means new or shortlisted; 'pending' matches nothing.
  const pending = useMemo(
    () => inScope(apps).filter((a) => a.status === 'new' || a.status === 'shortlisted'),
    [apps, inScope]);
  const roster = useMemo(() => inScope(invites), [invites, inScope]);
  const openIssues = useMemo(
    () => inScope(issues).filter((i) => i.status !== 'resolved' && i.status !== 'closed'),
    [issues, inScope],
  );

  const campaignFor = (appKey: string) => campaigns.find((c) => c.app_key === appKey);

  /** Mint codes. The plaintext comes back once and is never recoverable after this. */
  const issueCodes = async (appKey: string, specs: Record<string, unknown>[], applicationId?: string) => {
    const campaign = campaignFor(appKey);
    if (!campaign) {
      toast.error(`No pilot campaign exists for ${APP_LABEL[appKey] || appKey}.`);
      return;
    }
    setBusy(applicationId || 'manual');
    try {
      const { data, error } = await db.rpc('issue_test_cohort_codes', {
        p_campaign_id: campaign.id,
        p_specs: specs,
      });
      if (error) throw error;
      // The RPC returns { ok, issued, codes: [...] } -- not a bare array.
      if (!data?.ok) throw new Error(data?.error || 'issue failed');
      const rows = (data.codes ?? []) as MintedCode[];
      if (!rows.length) throw new Error('no codes returned');

      setMinted((prev) => [...rows.map((r) => ({ ...r, app_key: appKey })), ...prev]);

      if (applicationId) {
        await db.from('pilot_applications')
          .update({ status: 'invited', invite_id: rows[0].invite_id, reviewed_at: new Date().toISOString() })
          .eq('id', applicationId);
      }
      toast.success(
        rows.length === 1
          ? 'Code issued. Copy it now — it cannot be shown again.'
          : `${rows.length} codes issued. Copy them now — they cannot be shown again.`,
      );
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg.includes('42501') || msg.includes('admin') ? 'Admin role required.' : 'Could not issue the code.');
    } finally {
      setBusy(null);
    }
  };

  const decline = async (id: string) => {
    setBusy(id);
    await db.from('pilot_applications').update({ status: 'declined', reviewed_at: new Date().toISOString() }).eq('id', id);
    await load(); setBusy(null);
    toast.success('Application declined.');
  };

  const revoke = async (inviteId: string) => {
    setBusy(inviteId);
    const { error } = await db.rpc('revoke_test_cohort_invite', { p_invite_id: inviteId });
    setBusy(null);
    if (error) { toast.error('Could not revoke.'); return; }
    toast.success('Revoked. Any granted tier was restored.');
    await load();
  };

  const endPilot = async () => {
    setBusy('expire');
    const { error } = await db.rpc('expire_tier_grants');
    setBusy(null);
    if (error) { toast.error('Could not expire grants.'); return; }
    toast.success('Expired every grant past its date and restored prior tiers.');
    await load();
  };

  const resolveIssue = async (id: string) => {
    setBusy(id);
    await db.from('pilot_issue_reports')
      .update({ status: 'resolved', triaged_at: new Date().toISOString() }).eq('id', id);
    await load(); setBusy(null);
  };

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); toast.success('Copied.'); }
    catch { toast.error('Copy failed — select the code and copy it manually.'); }
  };

  const claimed = roster.filter((i) => i.status === 'claimed').length;

  if (loading) {
    return <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading pilot…
    </div>;
  }

  return (
    <div className="space-y-4">

      {/* summary + scope */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{pending.length} awaiting review</Badge>
          <Badge variant="outline">{roster.length} codes issued</Badge>
          <Badge variant="outline">{claimed} redeemed</Badge>
          <Badge variant={openIssues.length ? 'destructive' : 'outline'}>{openIssues.length} open issues</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Select value={scope} onValueChange={setScope}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={currentApp}>{APP_LABEL[currentApp] || currentApp} only</SelectItem>
              <SelectItem value="all">All three apps</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => void load()} aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* codes minted this session — the only time plaintext exists */}
      {minted.length > 0 && (
        <Card className="border-amber-500/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4" /> Codes issued in this session
            </CardTitle>
            <CardDescription className="flex items-start gap-1.5 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Only the hash is stored. Close this page and these are gone for good — send them now.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {minted.map((m) => (
              <div key={m.invite_id} className="flex items-center gap-3 rounded-md border p-2.5">
                <Badge variant="secondary">{APP_LABEL[m.app_key] || m.app_key}</Badge>
                <span className="text-sm text-muted-foreground">{m.label}</span>
                <code className="ml-auto font-mono text-sm tracking-wider">{m.code}</code>
                <Button size="sm" variant="ghost" onClick={() => void copy(m.code)}>
                  <ClipboardCopy className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="applications">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="roster">Roster</TabsTrigger>
          <TabsTrigger value="issues">Reports</TabsTrigger>
          <TabsTrigger value="wrap">Wrap up</TabsTrigger>
        </TabsList>

        {/* ── applications ── */}
        <TabsContent value="applications" className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Applicants accept the terms on the form itself, so there is nothing to countersign.
            Approving mints a code and marks them invited.
          </p>
          {pending.length === 0 ? (
            <p className="rounded-md border p-6 text-center text-sm text-muted-foreground">
              Nothing awaiting review.
            </p>
          ) : pending.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex flex-wrap items-start gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{a.full_name}</span>
                    <Badge variant="secondary">{APP_LABEL[a.app_key] || a.app_key}</Badge>
                    <Badge variant="outline">{a.intended_role}</Badge>
                    {a.email_confirmed_at ? (
                      <Badge className="bg-emerald-600 hover:bg-emerald-600">Email verified</Badge>
                    ) : (
                      <Badge variant="destructive">Email unverified</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {a.email}{a.phone ? ` · ${a.phone}` : ''}{a.city ? ` · ${a.city}` : ''}
                  </p>
                  {(a.profession || a.years_experience) && (
                    <p className="text-sm text-muted-foreground">
                      {a.profession}{a.years_experience ? ` · ${a.years_experience} yrs` : ''}
                      {a.device ? ` · ${a.device}` : ''}
                    </p>
                  )}
                  {a.motivation && <p className="mt-2 text-sm">{a.motivation}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Applied {fmt(a.created_at)}
                    {a.consented_at && ` · accepted ${fmt(a.consented_at)}`}
                    {a.consent_version && ` · ${a.consent_version}`}
                  </p>
                  {a.signature_data_url && (
                    <img
                      src={a.signature_data_url}
                      alt={`Signature of ${a.full_name}`}
                      className="mt-2 h-16 rounded border bg-background p-1"
                    />
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  {!a.email_confirmed_at && (
                    <p className="max-w-44 text-right text-xs text-muted-foreground">
                      They have not clicked the confirmation link yet, so this address is unproven.
                    </p>
                  )}
                  <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={busy === a.id} onClick={() => void decline(a.id)}>
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    // A code is an elevated production account. Issuing one against an
                    // address nobody proved they control is how it ends up with the
                    // wrong person -- a typo, or someone applying in another's name.
                    disabled={busy === a.id || !a.email_confirmed_at}
                    onClick={() => void issueCodes(a.app_key, [{
                      label: a.full_name, intended_role: a.intended_role,
                      granted_tier: a.intended_role === 'provider' ? 'enterprise' : null,
                      grant_days: 60, metadata: { application_id: a.id, email: a.email },
                    }], a.id)}
                  >
                    {busy === a.id ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                   : <KeyRound className="mr-1.5 h-3.5 w-3.5" />}
                    Approve & issue code
                  </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Issue a code directly</CardTitle>
              <CardDescription>For a tester recruited outside the form.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-end gap-3">
              <div className="min-w-40 flex-1">
                <Label htmlFor="pc-label" className="text-xs">Who it is for</Label>
                <Input id="pc-label" value={mLabel} onChange={(e) => setMLabel(e.target.value)} placeholder="Name or reference" />
              </div>
              <div>
                <Label className="text-xs">Role</Label>
                <Select value={mRole} onValueChange={setMRole}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="provider">Provider</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Tier</Label>
                <Select value={mTier} onValueChange={setMTier}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="elite">Elite</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="pc-days" className="text-xs">Days</Label>
                <Input id="pc-days" className="w-20" value={mDays} onChange={(e) => setMDays(e.target.value)} />
              </div>
              <Button
                disabled={busy === 'manual' || !mLabel.trim()}
                onClick={() => void issueCodes(scope === 'all' ? currentApp : scope, [{
                  label: mLabel.trim(), intended_role: mRole,
                  granted_tier: mRole === 'provider' ? mTier : null,
                  grant_days: Number(mDays) || 60,
                }])}
              >
                {busy === 'manual' ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                   : <KeyRound className="mr-1.5 h-3.5 w-3.5" />}
                Issue
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── roster ── */}
        <TabsContent value="roster" className="mt-4">
          {roster.length === 0 ? (
            <p className="rounded-md border p-6 text-center text-sm text-muted-foreground">
              No codes issued yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3">Tester</th><th className="p-3">App</th><th className="p-3">Role · tier</th>
                    <th className="p-3">Code</th><th className="p-3">Status</th><th className="p-3">Expires</th><th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {roster.map((i) => (
                    <tr key={i.id} className="border-t">
                      <td className="p-3">{i.label}</td>
                      <td className="p-3"><Badge variant="secondary">{APP_LABEL[i.app_key] || i.app_key}</Badge></td>
                      <td className="p-3 text-muted-foreground">{i.intended_role}{i.granted_tier ? ` · ${i.granted_tier}` : ''}</td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">••••{i.code_last4}</td>
                      <td className="p-3">
                        <Badge variant={
                          i.status === 'claimed' ? 'default'
                          : i.status === 'revoked' || i.status === 'expired' ? 'outline' : 'secondary'
                        }>{i.status}</Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">{fmt(i.grant_expires_at)}</td>
                      <td className="p-3 text-right">
                        {(i.status === 'pending' || i.status === 'claimed') && (
                          <Button size="sm" variant="ghost" disabled={busy === i.id} onClick={() => void revoke(i.id)}>
                            <Ban className="mr-1.5 h-3.5 w-3.5" /> Revoke
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ── issue reports ── */}
        <TabsContent value="issues" className="mt-4 space-y-3">
          {openIssues.length === 0 ? (
            <p className="rounded-md border p-6 text-center text-sm text-muted-foreground">
              Nothing reported yet.
            </p>
          ) : openIssues.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex flex-wrap items-start gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={r.severity === 'blocker' || r.severity === 'high' ? 'destructive' : 'secondary'}>
                      {r.severity}
                    </Badge>
                    <Badge variant="outline">{r.area}</Badge>
                    <Badge variant="secondary">{APP_LABEL[r.app_key] || r.app_key}</Badge>
                    <span className="font-medium">{r.title}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{r.body}</p>
                  {r.page_url && <p className="mt-1 break-all text-xs text-muted-foreground">{r.page_url}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">Reported {fmt(r.created_at)}</p>
                </div>
                <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => void resolveIssue(r.id)}>
                  <Check className="mr-1.5 h-3.5 w-3.5" /> Resolve
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ── wrap up ── */}
        <TabsContent value="wrap" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">End the pilot</CardTitle>
              <CardDescription>
                Expires every grant past its date and restores each account's prior tier. Test accounts
                stay flagged and stay invisible to real users — the flag is permanent by design, so
                nothing has to be purged for containment to hold.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" disabled={busy === 'expire'} onClick={() => void endPilot()}>
                {busy === 'expire' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                                   : <TimerOff className="mr-1.5 h-4 w-4" />}
                Expire grants that are due
              </Button>
              <p className="mt-3 text-xs text-muted-foreground">
                Safe to run any time — it only touches grants whose date has passed. There is no cron on
                this project, so this is the button that does it.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
