import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, Clock, Loader2, RefreshCcw, ShieldCheck, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { getBaiseAppKey } from '@/lib/providerCommunication';

type PartnerApplication = {
  id: string;
  app_key: string;
  campaign_id: string | null;
  user_id: string | null;
  status: string;
  full_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  city: string | null;
  primary_platform: string | null;
  primary_handle: string | null;
  total_followers: number;
  audience_summary: string | null;
  main_demographic: string | null;
  campaign_interests: string[] | null;
  review_due_at: string | null;
  created_at: string;
  partner_campaigns?: { name: string } | { name: string }[] | null;
};

const db = supabase as any;

const statusTone: Record<string, string> = {
  lead: 'border-sky-500/25 bg-sky-500/10 text-sky-700',
  submitted: 'border-amber-500/25 bg-amber-500/10 text-amber-700',
  under_review: 'border-amber-500/25 bg-amber-500/10 text-amber-700',
  approved: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700',
  waitlist: 'border-slate-500/25 bg-slate-500/10 text-slate-700',
  declined: 'border-destructive/25 bg-destructive/10 text-destructive',
};

function formatDate(value: string | null) {
  if (!value) return 'Not set';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function humanize(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getCampaignName(application: PartnerApplication) {
  const campaign = application.partner_campaigns;
  if (Array.isArray(campaign)) return campaign[0]?.name || 'Partner campaign';
  return campaign?.name || 'Partner campaign';
}

export function AdminPartnerApplications() {
  const appKey = getBaiseAppKey();
  const queryClient = useQueryClient();
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-partner-applications', appKey],
    queryFn: async () => {
      const { data, error } = await db
        .from('partner_influencer_applications')
        .select(`
          id,
          app_key,
          campaign_id,
          user_id,
          status,
          full_name,
          email,
          phone,
          country,
          city,
          primary_platform,
          primary_handle,
          total_followers,
          audience_summary,
          main_demographic,
          campaign_interests,
          review_due_at,
          created_at,
          partner_campaigns ( name )
        `)
        .eq('app_key', appKey)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as PartnerApplication[];
    },
  });

  const stats = useMemo(() => ({
    total: data.length,
    submitted: data.filter((item) => ['submitted', 'under_review'].includes(item.status)).length,
    approved: data.filter((item) => item.status === 'approved').length,
    leads: data.filter((item) => item.status === 'lead').length,
  }), [data]);

  const reviewApplication = async (applicationId: string, decision: 'approved' | 'declined' | 'waitlist' | 'under_review') => {
    setReviewingId(applicationId);
    try {
      const { error } = await db.rpc('review_partner_influencer_application', {
        target_application_id: applicationId,
        review_decision: decision,
        review_note: reviewNotes[applicationId] || null,
      });

      if (error) throw error;
      toast.success(`Application ${humanize(decision).toLowerCase()}`);
      setReviewNotes((current) => ({ ...current, [applicationId]: '' }));
      await queryClient.invalidateQueries({ queryKey: ['admin-partner-applications', appKey] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to review partner application');
    } finally {
      setReviewingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex min-h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Partner application review
              </CardTitle>
              <CardDescription>
                Vet influencer and partner applications, approve campaign access, or deny applications from one staff view.
              </CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => refetch()}>
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-4">
            <Metric label="Total" value={stats.total} />
            <Metric label="Needs review" value={stats.submitted} />
            <Metric label="Approved" value={stats.approved} />
            <Metric label="Leads" value={stats.leads} />
          </div>
        </CardContent>
      </Card>

      {data.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No partner applications have been submitted yet.
          </CardContent>
        </Card>
      ) : (
        data.map((application) => (
          <Card key={application.id}>
            <CardHeader className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">{application.full_name}</CardTitle>
                    <Badge variant="outline" className={statusTone[application.status] || ''}>
                      {humanize(application.status)}
                    </Badge>
                    {!application.user_id ? (
                      <Badge variant="secondary">No account yet</Badge>
                    ) : null}
                  </div>
                  <CardDescription className="mt-1">
                    {application.email} {application.phone ? `- ${application.phone}` : ''}
                  </CardDescription>
                </div>
                <div className="text-left text-xs text-muted-foreground sm:text-right">
                  <p>{getCampaignName(application)}</p>
                  <p>Review due {formatDate(application.review_due_at)}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <Info label="Followers" value={application.total_followers ? application.total_followers.toLocaleString() : 'Lead stage'} />
                <Info label="Platform" value={[application.primary_platform, application.primary_handle].filter(Boolean).join(' / ') || 'Not provided'} />
                <Info label="Location" value={[application.city, application.country].filter(Boolean).join(', ') || 'Not provided'} />
              </div>

              {application.audience_summary || application.main_demographic ? (
                <div className="rounded-md border bg-muted/30 p-3 text-sm leading-6">
                  <p className="font-medium">Audience</p>
                  <p className="mt-1 text-muted-foreground">{application.audience_summary || application.main_demographic}</p>
                </div>
              ) : null}

              <Textarea
                value={reviewNotes[application.id] || ''}
                onChange={(event) => setReviewNotes((current) => ({ ...current, [application.id]: event.target.value }))}
                placeholder="Internal review note"
                className="min-h-20"
              />

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  className="gap-2"
                  disabled={reviewingId === application.id}
                  onClick={() => reviewApplication(application.id, 'approved')}
                >
                  {reviewingId === application.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Approve
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  disabled={reviewingId === application.id}
                  onClick={() => reviewApplication(application.id, 'under_review')}
                >
                  <Clock className="h-4 w-4" />
                  Mark reviewing
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={reviewingId === application.id}
                  onClick={() => reviewApplication(application.id, 'waitlist')}
                >
                  Waitlist
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="gap-2"
                  disabled={reviewingId === application.id}
                  onClick={() => reviewApplication(application.id, 'declined')}
                >
                  <XCircle className="h-4 w-4" />
                  Deny
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-medium">{value}</p>
    </div>
  );
}
