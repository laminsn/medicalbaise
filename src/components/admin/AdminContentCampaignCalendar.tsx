import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Image,
  Mail,
  Megaphone,
  MessageSquare,
  Send,
  Smartphone,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  BLOG_CAMPAIGN_START_LABEL,
  BLOG_CAMPAIGN_TIMEZONE,
  BLOG_WEEKLY_CAMPAIGNS,
  CONTENT_CAMPAIGN_SUMMARY,
  PROMO_CAMPAIGNS,
  type CampaignChannel,
  type ChannelAsset,
} from '@/content/blogCampaignCalendar';

const channelIcon: Record<CampaignChannel, typeof Mail> = {
  email: Mail,
  push: Smartphone,
  whatsapp: MessageSquare,
  sms: Send,
};

const channelTone: Record<CampaignChannel, string> = {
  email: 'border-primary/25 bg-primary/10 text-primary',
  push: 'border-sky-500/25 bg-sky-500/10 text-sky-700',
  whatsapp: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700',
  sms: 'border-amber-500/25 bg-amber-500/10 text-amber-700',
};

const summaryCards = [
  {
    label: 'Tuesday sends',
    value: CONTENT_CAMPAIGN_SUMMARY.weeklyCampaigns,
    detail: 'Weekly cadence for one full year',
    icon: CalendarDays,
  },
  {
    label: 'Blog emails',
    value: CONTENT_CAMPAIGN_SUMMARY.blogEmailCampaigns,
    detail: 'Provider and client versions each week',
    icon: Mail,
  },
  {
    label: 'Channel assets',
    value: CONTENT_CAMPAIGN_SUMMARY.blogChannelAssets + CONTENT_CAMPAIGN_SUMMARY.promoChannelAssets,
    detail: 'Email, push, WhatsApp, and SMS',
    icon: MessageSquare,
  },
  {
    label: 'Social creatives',
    value: CONTENT_CAMPAIGN_SUMMARY.blogSocialAssets + CONTENT_CAMPAIGN_SUMMARY.promoSocialAssets,
    detail: 'Story, Facebook, and Instagram prompts',
    icon: Image,
  },
];

function humanize(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatSchedule(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: BLOG_CAMPAIGN_TIMEZONE,
  }).format(new Date(value));
}

function paragraphPreview(asset: ChannelAsset) {
  return asset.body.join(' ');
}

export function AdminContentCampaignCalendar() {
  const [selectedWeek, setSelectedWeek] = useState(1);
  const campaign = useMemo(
    () => BLOG_WEEKLY_CAMPAIGNS.find((item) => item.weekNumber === selectedWeek) || BLOG_WEEKLY_CAMPAIGNS[0],
    [selectedWeek],
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Content Campaign Calendar
              </CardTitle>
              <CardDescription>
                Full-year blog and promo campaigns prepared for email, push, WhatsApp, SMS, and social posts.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="w-fit">
              Starts {BLOG_CAMPAIGN_START_LABEL} {BLOG_CAMPAIGN_TIMEZONE}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="rounded-lg border bg-muted/40 p-3 text-sm leading-6 text-muted-foreground">
            The calendar is seeded from the actual 54 provider blog posts and 54 client blog posts. Each Tuesday send has a provider email,
            a client email, matching push, WhatsApp, SMS, and social creative prompts. Marketing sends should respect opt-in settings;
            transactional portal updates remain separate from blog and promo marketing.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((metric) => {
              const Icon = metric.icon;
              return (
                <Card key={metric.label}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">{metric.label}</p>
                        <p className="mt-1 text-2xl font-bold">{metric.value.toLocaleString()}</p>
                      </div>
                      <div className="rounded-full bg-primary/10 p-2 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-muted-foreground">{metric.detail}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="h-4 w-4 text-primary" />
              Promo Launches
            </CardTitle>
            <CardDescription>Two active promotions with launch and announcement campaigns.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {PROMO_CAMPAIGNS.map((promo) => (
                <div key={promo.id} className="rounded-lg border p-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold">{promo.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatSchedule(promo.scheduledAt)}</p>
                    </div>
                    <Badge variant="outline">{humanize(promo.kind)}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{promo.valueReason}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {promo.channels.map((asset) => {
                      const Icon = channelIcon[asset.channel];
                      return (
                        <Badge key={`${promo.id}-${asset.channel}`} variant="outline" className={channelTone[asset.channel]}>
                          <Icon className="mr-1 h-3.5 w-3.5" />
                          {asset.channel.toUpperCase()}
                        </Badge>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">{promo.rules.length} campaign rules attached</p>
                    <Button asChild variant="outline" size="sm">
                      <Link to={promo.landingPage}>View page</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock3 className="h-4 w-4 text-primary" />
              Weekly Blog Schedule
            </CardTitle>
            <CardDescription>Every Tuesday at 9 a.m. in Sao Paulo time.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[520px] pr-3">
              <div className="space-y-2">
                {BLOG_WEEKLY_CAMPAIGNS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedWeek(item.weekNumber)}
                    className={`w-full rounded-lg border p-3 text-left transition hover:border-primary/40 hover:bg-primary/5 ${
                      item.weekNumber === selectedWeek ? 'border-primary/50 bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">Week {item.weekNumber}: {item.audiences[0].post.category}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatSchedule(item.scheduledAt)}</p>
                      </div>
                      <Badge variant="secondary">2 audiences</Badge>
                    </div>
                    <div className="mt-2 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                      <p className="line-clamp-2">Provider: {item.audiences[0].post.title}</p>
                      <p className="line-clamp-2">Client: {item.audiences[1].post.title}</p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="text-base">Week {campaign.weekNumber} Channel Preview</CardTitle>
              <CardDescription>{campaign.title} - {formatSchedule(campaign.scheduledAt)}</CardDescription>
            </div>
            <Badge variant="outline">Campaign ID: {campaign.campaignKey}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {campaign.audiences.map((audienceCampaign) => (
            <div key={audienceCampaign.post.id} className="rounded-lg border p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <Badge variant="secondary">{humanize(audienceCampaign.audience)}</Badge>
                  <h3 className="mt-2 text-base font-semibold">{audienceCampaign.post.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{audienceCampaign.valueReason}</p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to={`/blog/${audienceCampaign.post.slug}`}>Open article</Link>
                </Button>
              </div>
              <Separator className="my-4" />
              <div className="grid gap-3 lg:grid-cols-2">
                {audienceCampaign.channels.map((asset) => (
                  <ChannelPreview key={`${audienceCampaign.post.id}-${asset.channel}`} asset={asset} />
                ))}
              </div>
              <Separator className="my-4" />
              <div>
                <p className="mb-3 text-sm font-semibold">Social post creative</p>
                <div className="grid gap-3 md:grid-cols-3">
                  {audienceCampaign.social.map((social) => (
                    <div key={`${audienceCampaign.post.id}-${social.format}`} className="rounded-lg border bg-muted/30 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{humanize(social.format)}</p>
                        <Badge variant="outline">{social.sizeLabel}</Badge>
                      </div>
                      <p className="mt-2 text-xs font-semibold">{social.headline}</p>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">{social.caption}</p>
                      <p className="mt-3 rounded-md bg-background p-2 text-xs leading-5 text-muted-foreground">
                        {social.visualPrompt}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-emerald-500/25">
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-start">
          <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="space-y-1 text-sm leading-6 text-muted-foreground">
            <p className="font-semibold text-foreground">Production wiring note</p>
            <p>
              The campaign calendar, copy, CTAs, product tie-ins, and social creative specs are ready in code. Final live dispatch still
              needs audience selection, sender credentials, unsubscribe handling for marketing, and API keys for Resend, push, WhatsApp/SMS,
              and Postiz before any real sends are triggered.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ChannelPreview({ asset }: { asset: ChannelAsset }) {
  const Icon = channelIcon[asset.channel];
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge variant="outline" className={channelTone[asset.channel]}>
            <Icon className="mr-1 h-3.5 w-3.5" />
            {asset.channel.toUpperCase()}
          </Badge>
          <p className="mt-3 text-sm font-semibold">{asset.subject}</p>
          <p className="mt-1 text-xs text-muted-foreground">{asset.preview}</p>
        </div>
        <Badge variant="secondary">{asset.deliveryPolicy}</Badge>
      </div>
      <p className="mt-3 line-clamp-5 text-xs leading-5 text-muted-foreground">{paragraphPreview(asset)}</p>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs">
        <span className="text-muted-foreground">CTA: {asset.ctaLabel}</span>
        <span className="font-medium text-primary">{asset.ctaPath}</span>
      </div>
    </div>
  );
}
