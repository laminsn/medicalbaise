import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardList,
  DollarSign,
  MousePointerClick,
  Repeat,
  Search,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BLOG_ANALYTICS_NOTE,
  BLOG_ANALYTICS_ROWS,
  BLOG_ANALYTICS_SUMMARY,
  BLOG_CONVERSION_TOP_ARTICLES,
  BLOG_EDITORIAL_ACTION_QUEUE,
  BLOG_EVENT_BLUEPRINT,
  BLOG_FUNNEL_STEPS,
  BLOG_SOURCE_MIX,
  BLOG_TRACTION_TOP_ARTICLES,
  type BlogAnalyticsRow,
} from '@/content/blogAnalytics';

const compactNumber = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 });
const wholeNumber = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
const currency = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

function formatNumber(value: number) {
  return wholeNumber.format(value);
}

function formatCompact(value: number) {
  return compactNumber.format(value);
}

function formatCurrency(value: number) {
  return currency.format(value);
}

function audienceTone(audience: BlogAnalyticsRow['audience']) {
  return audience === 'provider'
    ? 'border-primary/20 bg-primary/10 text-primary'
    : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700';
}

function sourceLabel(source: string) {
  return source.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const metricCards = [
  {
    label: 'Articles tracked',
    value: BLOG_ANALYTICS_SUMMARY.totalArticles,
    detail: `${BLOG_ANALYTICS_SUMMARY.providerArticles} provider + ${BLOG_ANALYTICS_SUMMARY.clientArticles} client posts`,
    icon: BookOpen,
    formatter: formatNumber,
  },
  {
    label: 'Views',
    value: BLOG_ANALYTICS_SUMMARY.views,
    detail: 'Seeded article-level traction',
    icon: Search,
    formatter: formatCompact,
  },
  {
    label: 'Engaged reads',
    value: BLOG_ANALYTICS_SUMMARY.engagedReads,
    detail: 'Readers with meaningful time or depth',
    icon: TrendingUp,
    formatter: formatCompact,
  },
  {
    label: 'CTA clicks',
    value: BLOG_ANALYTICS_SUMMARY.ctaClicks,
    detail: 'Sticky, inline, footer, offer, and partner CTAs',
    icon: MousePointerClick,
    formatter: formatCompact,
  },
  {
    label: 'Members',
    value: BLOG_ANALYTICS_SUMMARY.memberConversions,
    detail: 'Account starts and member conversions',
    icon: Users,
    formatter: formatCompact,
  },
  {
    label: 'Clients',
    value: BLOG_ANALYTICS_SUMMARY.clientConversions,
    detail: 'Paid client or provider upgrade conversions',
    icon: Target,
    formatter: formatCompact,
  },
  {
    label: 'Attributed value',
    value: BLOG_ANALYTICS_SUMMARY.attributedValue,
    detail: 'Seeded BRL value for future attribution',
    icon: DollarSign,
    formatter: formatCurrency,
  },
  {
    label: 'Avg. scroll depth',
    value: BLOG_ANALYTICS_SUMMARY.averageScrollDepth,
    detail: 'Quality signal for article layout and CTAs',
    icon: BarChart3,
    formatter: (value: number) => `${value}%`,
  },
];

export function AdminBlogAnalytics() {
  const sortedRows = [...BLOG_ANALYTICS_ROWS].sort(
    (a, b) => b.attributedValue - a.attributedValue || b.clientConversions - a.clientConversions,
  );
  const maxFunnelValue = BLOG_FUNNEL_STEPS[0]?.value || 1;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Blog Analytics
              </CardTitle>
              <CardDescription>
                Article-level traction across the 54-post provider calendar and 54-post client calendar.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="w-fit">
              Demo analytics ready for production wiring
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="rounded-lg border bg-muted/40 p-3 text-sm leading-6 text-muted-foreground">
            {BLOG_ANALYTICS_NOTE}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                    <p className="mt-1 text-2xl font-bold">{metric.formatter(metric.value)}</p>
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

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Repeat className="h-4 w-4 text-primary" />
              Content Funnel
            </CardTitle>
            <CardDescription>Views -&gt; engaged reads -&gt; CTA clicks -&gt; members -&gt; clients.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {BLOG_FUNNEL_STEPS.map((step, index) => {
              const previous = BLOG_FUNNEL_STEPS[index - 1]?.value;
              const stepRate = previous ? Math.round((step.value / previous) * 100) : 100;
              return (
                <div key={step.label} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{step.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {index === 0 ? 'Top of funnel' : `${stepRate}% of previous step`}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">{formatNumber(step.value)}</p>
                  </div>
                  <Progress value={(step.value / maxFunnelValue) * 100} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-primary" />
              Editorial Action Queue
            </CardTitle>
            <CardDescription>Promote next, update for trust, and retarget engaged readers.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {BLOG_EDITORIAL_ACTION_QUEUE.map((item) => (
                <div key={item.action} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{item.action}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.trigger}</p>
                    </div>
                    <Badge variant="outline">{item.owner}</Badge>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.outcome}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ArticleRankingCard
          title="Top traction articles"
          description="Highest engaged-read volume across the blog calendar."
          rows={BLOG_TRACTION_TOP_ARTICLES}
          valueLabel="Engaged reads"
          getValue={(row) => formatNumber(row.engagedReads)}
        />
        <ArticleRankingCard
          title="Best conversion articles"
          description="Highest client conversion count and attributed value."
          rows={BLOG_CONVERSION_TOP_ARTICLES}
          valueLabel="Clients"
          getValue={(row) => `${formatNumber(row.clientConversions)} / ${formatCurrency(row.attributedValue)}`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-primary" />
            Source Mix Quality
          </CardTitle>
          <CardDescription>
            Organic search, Resend, partners, social, branded/direct, and AI answer engines.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {BLOG_SOURCE_MIX.map((source) => (
              <div key={source.key} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{source.label}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{source.note}</p>
                  </div>
                  <Badge variant="secondary">{source.qualityScore}/100</Badge>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <InfoMetric label="Share" value={`${source.share}%`} />
                  <InfoMetric label="Reads" value={`${source.engagedReadRate}%`} />
                  <InfoMetric label="CVR" value={`${source.conversionRate}%`} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-4 w-4 text-primary" />
            Article-Level Traction Metrics
          </CardTitle>
          <CardDescription>
            Every seeded blog row includes views, engaged reads, CTA clicks, scroll depth, conversions, value, source, and next editorial action.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[620px] rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[320px]">Article</TableHead>
                  <TableHead>Audience</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Reads</TableHead>
                  <TableHead>CTA</TableHead>
                  <TableHead>Scroll</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Clients</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead className="min-w-[260px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRows.map((row) => (
                  <TableRow key={row.slug}>
                    <TableCell>
                      <div className="space-y-1">
                        <Link to={row.url} className="inline-flex items-center gap-1 font-medium hover:text-primary">
                          {row.title}
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          Calendar {row.calendarSlot}/54 - {sourceLabel(row.primarySource)} - {row.qualitySignal}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={audienceTone(row.audience)}>
                        {row.audience}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatNumber(row.views)}</TableCell>
                    <TableCell>{formatNumber(row.engagedReads)}</TableCell>
                    <TableCell>{formatNumber(row.ctaClicks)}</TableCell>
                    <TableCell>{row.averageScrollDepth}%</TableCell>
                    <TableCell>{formatNumber(row.memberConversions)}</TableCell>
                    <TableCell>{formatNumber(row.clientConversions)}</TableCell>
                    <TableCell>{formatCurrency(row.attributedValue)}</TableCell>
                    <TableCell className="text-xs leading-5 text-muted-foreground">{row.recommendation}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-primary" />
            Analytics Event Blueprint
          </CardTitle>
          <CardDescription>
            Event names and payloads for future real tracking across website, Resend, portal accounts, referrals, and Empire Hub.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {BLOG_EVENT_BLUEPRINT.map((event) => (
              <div key={event.eventName} className="rounded-lg border p-4">
                <Badge variant="secondary">{event.eventName}</Badge>
                <p className="mt-3 text-sm font-medium">{event.purpose}</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{event.downstreamUse}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {event.payload.map((field) => (
                    <Badge key={field} variant="outline" className="font-mono text-[10px]">
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ArticleRankingCard({
  title,
  description,
  rows,
  valueLabel,
  getValue,
}: {
  title: string;
  description: string;
  rows: BlogAnalyticsRow[];
  valueLabel: string;
  getValue: (row: BlogAnalyticsRow) => string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div key={row.slug} className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link to={row.url} className="font-medium hover:text-primary">
                    {index + 1}. {row.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {row.audience} - calendar {row.calendarSlot}/54 - {sourceLabel(row.primarySource)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{valueLabel}</p>
                  <p className="text-sm font-semibold">{getValue(row)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function InfoMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/50 p-2">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
