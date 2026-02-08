import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Mail, Send, BookOpen, Video, Star, Zap, 
  DollarSign, MessageSquare, Loader2, Clock 
} from 'lucide-react';

const CAMPAIGN_PREVIEWS = [
  {
    week: 1,
    title: "Profile Optimization",
    subject: "The #1 Mistake Killing Your Profile Views",
    icon: Star,
    category: "profile_optimization",
    description: "Teaches providers to optimize their profile photo, bio, and services for maximum visibility.",
  },
  {
    week: 2,
    title: "Content Strategy",
    subject: "Create Posts That Get Clients (Not Just Likes)",
    icon: BookOpen,
    category: "content_strategy",
    description: "The perfect post formula: Hook → Context → Proof → CTA. Before/after, pricing transparency, video.",
  },
  {
    week: 3,
    title: "Case Study: Dr. Silva",
    subject: "How Dr. Silva Got 23 New Patients in 30 Days",
    icon: MessageSquare,
    category: "case_study",
    description: "Real case study showing consistent posting + fast responses = 23 new patients in 30 days.",
  },
  {
    week: 4,
    title: "Live Streaming",
    subject: "Go Live & 10x Your Visibility",
    icon: Video,
    category: "live_streaming",
    description: "Live stream playbook: topic selection, 24h pre-announce, engage comments, end with CTA.",
  },
  {
    week: 5,
    title: "Pricing Psychology",
    subject: "How Top Providers Charge 2x More",
    icon: DollarSign,
    category: "pricing_strategy",
    description: "Value stacking, guarantees, packages over hourly rates. Hormozi's Grand Slam Offer framework.",
  },
  {
    week: 6,
    title: "Stories Strategy",
    subject: "Stories That Sell: Your 24-Hour Secret Weapon",
    icon: Zap,
    category: "stories_strategy",
    description: "Daily story rotation: morning prep, midday work, afternoon results, evening tips.",
  },
  {
    week: 7,
    title: "Case Study: Reviews",
    subject: "From 0 to 50 Reviews in 60 Days",
    icon: Star,
    category: "case_study",
    description: "How Marco the personal trainer built social proof and raised prices 35%.",
  },
  {
    week: 8,
    title: "Response Time",
    subject: "The Hidden Metric That Makes or Breaks Your Business",
    icon: Clock,
    category: "operations",
    description: "Speed to lead data: 5-min response = 21x more conversions. Templates, auto-replies, notification strategies.",
  },
];

export function AdminEmailCampaigns() {
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const handleSendCampaign = async () => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-weekly-campaign');

      if (error) throw error;

      setLastResult(data);
      toast.success(`Campaign sent to ${data.emailsSent} providers!`);
    } catch (err: any) {
      toast.error('Failed to send campaign: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  // Calculate current week
  const startDate = new Date("2026-01-01");
  const now = new Date();
  const weeksSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const currentWeekIndex = weeksSinceStart % CAMPAIGN_PREVIEWS.length;

  return (
    <div className="space-y-6">
      {/* Send Campaign Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Weekly Provider Education Campaign
          </CardTitle>
          <CardDescription>
            Educational emails inspired by Gary Vee, Alex Hormozi & MrBeast strategies. 
            Rotates through {CAMPAIGN_PREVIEWS.length} topics weekly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
            <div>
              <p className="font-medium">Current Week: #{currentWeekIndex + 1}</p>
              <p className="text-sm text-muted-foreground">
                {CAMPAIGN_PREVIEWS[currentWeekIndex]?.subject}
              </p>
            </div>
            <Button onClick={handleSendCampaign} disabled={sending}>
              {sending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Now
            </Button>
          </div>

          {lastResult && (
            <div className="p-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
              <p className="font-medium text-green-700 dark:text-green-400">✅ Campaign Sent</p>
              <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Emails Sent</p>
                  <p className="font-bold text-lg">{lastResult.emailsSent}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Notifications</p>
                  <p className="font-bold text-lg">{lastResult.notificationsSent}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Errors</p>
                  <p className="font-bold text-lg">{lastResult.emailErrors}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campaign Library */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campaign Library ({CAMPAIGN_PREVIEWS.length} weeks rotation)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {CAMPAIGN_PREVIEWS.map((campaign, index) => {
              const Icon = campaign.icon;
              const isCurrent = index === currentWeekIndex;
              return (
                <div
                  key={campaign.week}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    isCurrent ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isCurrent ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Icon className={`h-4 w-4 ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">Week {campaign.week}: {campaign.title}</p>
                      {isCurrent && <Badge variant="default" className="text-xs">Current</Badge>}
                      <Badge variant="outline" className="text-xs">{campaign.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{campaign.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
