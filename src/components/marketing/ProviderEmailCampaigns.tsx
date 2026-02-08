import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFollowerStats } from '@/hooks/useFollowerStats';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Mail,
  Send,
  Users,
  Loader2,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertCircle,
  Trash2,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

interface Campaign {
  id: string;
  subject: string;
  html_content: string;
  total_recipients: number;
  emails_sent: number;
  emails_failed: number;
  cost_per_email: number;
  total_cost: number;
  status: string;
  sent_at: string | null;
  created_at: string;
}

const COST_PER_EMAIL = 0.05;

const EMAIL_TEMPLATES = [
  {
    name: '🔥 Special Offer',
    subject: '🔥 Exclusive Offer Just for You!',
    content: `<h2>Special Offer for Our Valued Followers!</h2>
<p>As a thank you for following us, we're offering an <strong>exclusive discount</strong> this week only.</p>
<p>📅 <strong>Limited time offer</strong> — Book before this Friday!</p>
<p>💰 <strong>20% off</strong> your first consultation</p>
<p>Don't miss out on this opportunity to experience premium care at an unbeatable price.</p>`,
  },
  {
    name: '📅 New Availability',
    subject: '📅 New Appointment Slots Available!',
    content: `<h2>We've Opened New Appointment Slots!</h2>
<p>Great news! We have <strong>new availability</strong> this week.</p>
<p>Whether you need a routine check-up or a specialized consultation, we've got you covered.</p>
<p>🕐 <strong>Morning and evening slots available</strong></p>
<p>📍 <strong>In-person and teleconsultation options</strong></p>
<p>Book now before slots fill up!</p>`,
  },
  {
    name: '✨ New Service',
    subject: '✨ Exciting New Service Now Available!',
    content: `<h2>Introducing Our Newest Service!</h2>
<p>We're excited to announce that we now offer a <strong>brand new service</strong> designed to better serve your needs.</p>
<p>🌟 <strong>State-of-the-art techniques</strong></p>
<p>💯 <strong>Satisfaction guaranteed</strong></p>
<p>Visit our profile to learn more and book your appointment today!</p>`,
  },
];

export function ProviderEmailCampaigns() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [providerId, setProviderId] = useState<string | null>(null);
  const [providerName, setProviderName] = useState('');
  const { followersCount, isLoading: statsLoading } = useFollowerStats(providerId);

  // Form state
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // History
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const creditsBalance = profile?.credits_balance || 0;
  const estimatedCost = followersCount * COST_PER_EMAIL;
  const hasEnoughCredits = creditsBalance >= estimatedCost;

  useEffect(() => {
    const fetchProvider = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('providers')
        .select('id, business_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setProviderId(data.id);
        setProviderName(data.business_name);
      }
    };
    fetchProvider();
  }, [user]);

  const fetchCampaigns = useCallback(async () => {
    if (!providerId) return;
    setLoadingHistory(true);

    const { data } = await supabase
      .from('provider_email_campaigns')
      .select('*')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setCampaigns(data as Campaign[]);
    }
    setLoadingHistory(false);
  }, [providerId]);

  useEffect(() => {
    if (providerId) fetchCampaigns();
  }, [providerId, fetchCampaigns]);

  const handleSendCampaign = async () => {
    if (!providerId || !subject.trim() || !htmlContent.trim()) {
      toast.error('Please fill in subject and content');
      return;
    }

    if (followersCount === 0) {
      toast.error('You have no followers yet');
      return;
    }

    if (!hasEnoughCredits) {
      toast.error(`Insufficient credits. Need R$${estimatedCost.toFixed(2)}, have R$${creditsBalance.toFixed(2)}`);
      return;
    }

    setIsSending(true);

    try {
      // Create draft campaign first
      const { data: campaign, error: createError } = await supabase
        .from('provider_email_campaigns')
        .insert({
          provider_id: providerId,
          subject: subject.trim(),
          html_content: htmlContent.trim(),
          recipient_type: 'followers',
          cost_per_email: COST_PER_EMAIL,
        })
        .select()
        .single();

      if (createError || !campaign) throw new Error('Failed to create campaign');

      // Send via edge function
      const { data, error } = await supabase.functions.invoke('send-provider-campaign', {
        body: { campaignId: campaign.id },
      });

      if (error) throw error;

      toast.success(
        `Campaign sent to ${data.emailsSent} followers! Cost: R$${data.totalCost.toFixed(2)}`
      );

      setSubject('');
      setHtmlContent('');
      setShowPreview(false);
      fetchCampaigns();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send campaign';
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  const applyTemplate = (template: typeof EMAIL_TEMPLATES[0]) => {
    setSubject(template.subject);
    setHtmlContent(template.content);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Sent</Badge>;
      case 'sending':
        return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">Sending...</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{statsLoading ? '—' : followersCount}</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-500/10">
              <DollarSign className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">R${creditsBalance.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Credit Balance</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                R${COST_PER_EMAIL.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">Per Email</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compose Campaign */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Compose Email Campaign
          </CardTitle>
          <CardDescription>
            Send branded emails directly to your {followersCount} followers. Each email costs R${COST_PER_EMAIL.toFixed(2)}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Templates */}
          <div>
            <p className="text-sm font-medium mb-2">Quick Templates</p>
            <div className="flex flex-wrap gap-2">
              {EMAIL_TEMPLATES.map((tmpl) => (
                <Button
                  key={tmpl.name}
                  variant="outline"
                  size="sm"
                  onClick={() => applyTemplate(tmpl)}
                >
                  {tmpl.name}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Subject */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Subject</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Special Offer This Week Only!"
              maxLength={150}
            />
            <p className="text-xs text-muted-foreground text-right">{subject.length}/150</p>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Content (HTML supported)</label>
            <Textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              placeholder="Write your email content... HTML tags like <h2>, <p>, <strong>, <ul> are supported."
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          {/* Preview Toggle */}
          {(subject || htmlContent) && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="h-4 w-4" />
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
          )}

          {/* Preview */}
          {showPreview && (subject || htmlContent) && (
            <div className="rounded-lg border border-border bg-white dark:bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Email Preview</p>
              <div className="border-b border-border pb-2 mb-3">
                <p className="text-xs text-muted-foreground">From: {providerName} via MDBaise</p>
                <p className="font-semibold text-sm">{subject || '(No subject)'}</p>
              </div>
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: htmlContent || '<p>(No content)</p>' }}
              />
            </div>
          )}

          {/* Cost Estimate */}
          <div className={`rounded-lg border p-4 ${hasEnoughCredits ? 'border-border bg-muted/30' : 'border-destructive/50 bg-destructive/5'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {hasEnoughCredits ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
                <span className="text-sm font-medium">Estimated Cost</span>
              </div>
              <div className="text-right">
                <p className="font-bold">R${estimatedCost.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                  {followersCount} emails × R${COST_PER_EMAIL.toFixed(2)}
                </p>
              </div>
            </div>
            {!hasEnoughCredits && (
              <p className="text-xs text-destructive mt-2">
                Insufficient credits. Please add R${(estimatedCost - creditsBalance).toFixed(2)} more.
              </p>
            )}
          </div>

          {/* Send Button */}
          <Button
            className="w-full gap-2"
            onClick={handleSendCampaign}
            disabled={
              isSending ||
              !subject.trim() ||
              !htmlContent.trim() ||
              followersCount === 0 ||
              !hasEnoughCredits
            }
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending campaign...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send to {followersCount} followers (R${estimatedCost.toFixed(2)})
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Campaign History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Campaign History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No email campaigns sent yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border"
                >
                  <div className="mt-0.5">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm truncate">{campaign.subject}</p>
                      {getStatusBadge(campaign.status)}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>{campaign.emails_sent} sent</span>
                      {campaign.emails_failed > 0 && (
                        <span className="text-destructive">{campaign.emails_failed} failed</span>
                      )}
                      <span>R${campaign.total_cost.toFixed(2)}</span>
                      <span>
                        {new Date(campaign.sent_at || campaign.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
