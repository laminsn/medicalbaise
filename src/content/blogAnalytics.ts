import { BAISE_BLOG_POSTS, type BaiseBlogPost } from './baiseBlogPosts';

export type BlogAnalyticsSourceKey =
  | 'organic_search'
  | 'resend'
  | 'partners'
  | 'social'
  | 'branded_direct'
  | 'ai_answer_engines';

export type BlogAnalyticsRow = {
  slug: string;
  title: string;
  audience: BaiseBlogPost['audience'];
  niche: BaiseBlogPost['niche'];
  calendarSlot: number;
  url: string;
  views: number;
  engagedReads: number;
  ctaClicks: number;
  averageScrollDepth: number;
  memberConversions: number;
  clientConversions: number;
  attributedValue: number;
  primarySource: BlogAnalyticsSourceKey;
  qualitySignal: string;
  recommendation: string;
};

export type BlogSourceMix = {
  key: BlogAnalyticsSourceKey;
  label: string;
  share: number;
  views: number;
  engagedReadRate: number;
  conversionRate: number;
  qualityScore: number;
  note: string;
};

export type BlogEventBlueprint = {
  eventName: string;
  purpose: string;
  payload: string[];
  downstreamUse: string;
};

export type BlogEditorialAction = {
  action: string;
  owner: string;
  trigger: string;
  outcome: string;
};

const sourceCycle: BlogAnalyticsSourceKey[] = [
  'organic_search',
  'resend',
  'partners',
  'social',
  'branded_direct',
  'ai_answer_engines',
];

const sourceLabels: Record<BlogAnalyticsSourceKey, string> = {
  organic_search: 'Organic search',
  resend: 'Resend',
  partners: 'Partners',
  social: 'Social',
  branded_direct: 'Branded/direct',
  ai_answer_engines: 'AI answer engines',
};

const sourceNotes: Record<BlogAnalyticsSourceKey, string> = {
  organic_search: 'High-intent education traffic finding vetting, payments, and provider growth topics.',
  resend: 'Lifecycle email traffic from welcome, follow-up, referral, and product-fit journeys.',
  partners: 'Tracked partner, affiliate, influencer, referral link, QR, and code traffic.',
  social: 'Discovery traffic from provider stories, short-form content, influencer posts, and UGC campaigns.',
  branded_direct: 'People who already know Baise or return after a portal, ad, or referral touch.',
  ai_answer_engines: 'Readers arriving from AI summaries and answer surfaces that cite helpful education.',
};

export const BLOG_ANALYTICS_NOTE =
  'Current blog analytics are seeded/demo values so the Growth workspace is useful immediately. The production step is wiring these events into website tracking, Resend, portal accounts, referrals, and the Empire Hub.';

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function sourceForPost(post: BaiseBlogPost, index: number): BlogAnalyticsSourceKey {
  if (post.category.toLowerCase().includes('campaign')) return 'resend';
  if (post.category.toLowerCase().includes('reputation')) return 'organic_search';
  if (post.category.toLowerCase().includes('crm')) return 'branded_direct';
  if (post.title.toLowerCase().includes('referral')) return 'partners';
  if (post.title.toLowerCase().includes('social') || post.title.toLowerCase().includes('content')) return 'social';
  return sourceCycle[index % sourceCycle.length];
}

function qualitySignalForPost(post: BaiseBlogPost) {
  if (post.statPreset === 'reviews') return 'Trust education';
  if (post.statPreset === 'payments') return 'Revenue operations';
  if (post.statPreset === 'medical') return 'Medical access clarity';
  if (post.statPreset === 'legal') return 'Legal vetting clarity';
  if (post.statPreset === 'growth') return 'Growth and conversion';
  if (post.statPreset === 'providerOps') return 'Provider operating rhythm';
  return 'Market education';
}

function recommendationFor(row: Omit<BlogAnalyticsRow, 'recommendation'>) {
  if (row.clientConversions >= 24) return 'Promote next in Resend, partner shares, and homepage education blocks.';
  if (row.ctaClicks >= 220) return 'Retarget engaged readers with a value-based portal CTA.';
  if (row.averageScrollDepth < 66) return 'Update opening, add trust proof, and move the strongest CTA higher.';
  if (row.primarySource === 'ai_answer_engines') return 'Add concise answer blocks and structured FAQ for AI visibility.';
  return 'Keep in calendar rotation and refresh source links during the next editorial pass.';
}

export const BLOG_ANALYTICS_ROWS: BlogAnalyticsRow[] = BAISE_BLOG_POSTS.map((post, index) => {
  const source = sourceForPost(post, index);
  const authorityBoost =
    post.statPreset === 'reviews'
      ? 260
      : post.statPreset === 'medical' || post.statPreset === 'legal'
        ? 210
        : post.statPreset === 'payments'
          ? 180
          : post.statPreset === 'growth'
            ? 150
            : 90;
  const baseViews = post.audience === 'provider' ? 940 : 1080;
  const views = baseViews + authorityBoost + (index % 11) * 137 + (post.actions.length >= 4 ? 80 : 0);
  const engagedRate = 0.38 + (index % 6) * 0.032 + (source === 'resend' ? 0.04 : 0) + (source === 'partners' ? 0.03 : 0);
  const engagedReads = Math.round(views * clamp(engagedRate, 0.36, 0.62));
  const clickRate = 0.14 + (index % 5) * 0.018 + (post.audience === 'client' ? 0.018 : 0);
  const ctaClicks = Math.round(engagedReads * clamp(clickRate, 0.12, 0.25));
  const memberConversions = Math.round(ctaClicks * (post.audience === 'client' ? 0.24 : 0.18));
  const clientConversions = Math.round(memberConversions * (post.audience === 'client' ? 0.34 : 0.23));
  const averageScrollDepth = clamp(
    58 + (index % 8) * 4 + (source === 'resend' ? 4 : 0) + (post.sourceKeys.length >= 2 ? 3 : 0),
    58,
    92,
  );
  const attributedValue = clientConversions * (post.audience === 'provider' ? 460 : 390) + memberConversions * 35;
  const rowWithoutRecommendation = {
    slug: post.slug,
    title: post.title,
    audience: post.audience,
    niche: post.niche,
    calendarSlot: ((post.number - 1) % 54) + 1,
    url: `/blog/${post.slug}`,
    views,
    engagedReads,
    ctaClicks,
    averageScrollDepth,
    memberConversions,
    clientConversions,
    attributedValue,
    primarySource: source,
    qualitySignal: qualitySignalForPost(post),
  };

  return {
    ...rowWithoutRecommendation,
    recommendation: recommendationFor(rowWithoutRecommendation),
  };
});

const totals = BLOG_ANALYTICS_ROWS.reduce(
  (acc, row) => {
    acc.views += row.views;
    acc.engagedReads += row.engagedReads;
    acc.ctaClicks += row.ctaClicks;
    acc.memberConversions += row.memberConversions;
    acc.clientConversions += row.clientConversions;
    acc.attributedValue += row.attributedValue;
    acc.scrollTotal += row.averageScrollDepth;
    return acc;
  },
  {
    views: 0,
    engagedReads: 0,
    ctaClicks: 0,
    memberConversions: 0,
    clientConversions: 0,
    attributedValue: 0,
    scrollTotal: 0,
  },
);

export const BLOG_ANALYTICS_SUMMARY = {
  totalArticles: BLOG_ANALYTICS_ROWS.length,
  providerArticles: BLOG_ANALYTICS_ROWS.filter((row) => row.audience === 'provider').length,
  clientArticles: BLOG_ANALYTICS_ROWS.filter((row) => row.audience === 'client').length,
  views: totals.views,
  engagedReads: totals.engagedReads,
  ctaClicks: totals.ctaClicks,
  memberConversions: totals.memberConversions,
  clientConversions: totals.clientConversions,
  attributedValue: totals.attributedValue,
  averageScrollDepth: Math.round(totals.scrollTotal / BLOG_ANALYTICS_ROWS.length),
};

export const BLOG_FUNNEL_STEPS = [
  { label: 'Views', value: totals.views },
  { label: 'Engaged reads', value: totals.engagedReads },
  { label: 'CTA clicks', value: totals.ctaClicks },
  { label: 'Members', value: totals.memberConversions },
  { label: 'Clients', value: totals.clientConversions },
] as const;

export const BLOG_TRACTION_TOP_ARTICLES = [...BLOG_ANALYTICS_ROWS]
  .sort((a, b) => b.engagedReads - a.engagedReads)
  .slice(0, 8);

export const BLOG_CONVERSION_TOP_ARTICLES = [...BLOG_ANALYTICS_ROWS]
  .sort((a, b) => b.clientConversions - a.clientConversions || b.attributedValue - a.attributedValue)
  .slice(0, 8);

export const BLOG_SOURCE_MIX: BlogSourceMix[] = sourceCycle.map((source) => {
  const rows = BLOG_ANALYTICS_ROWS.filter((row) => row.primarySource === source);
  const views = rows.reduce((sum, row) => sum + row.views, 0);
  const engagedReads = rows.reduce((sum, row) => sum + row.engagedReads, 0);
  const clientConversions = rows.reduce((sum, row) => sum + row.clientConversions, 0);
  const share = Math.round((views / totals.views) * 100);
  const engagedReadRate = Math.round((engagedReads / views) * 100);
  const conversionRate = Number(((clientConversions / views) * 100).toFixed(2));
  const qualityScore = clamp(Math.round(engagedReadRate * 0.7 + conversionRate * 8 + share * 0.25), 0, 100);

  return {
    key: source,
    label: sourceLabels[source],
    share,
    views,
    engagedReadRate,
    conversionRate,
    qualityScore,
    note: sourceNotes[source],
  };
});

export const BLOG_EVENT_BLUEPRINT: BlogEventBlueprint[] = [
  {
    eventName: 'blog_article_view',
    purpose: 'Record every article page load with source, language, app, campaign, and reader identity when known.',
    payload: ['article_slug', 'audience', 'niche', 'locale', 'app_key', 'utm_source', 'referral_code', 'person_id'],
    downstreamUse: 'Feeds article traction, source mix, retargeting, and first-touch attribution.',
  },
  {
    eventName: 'blog_engaged_read',
    purpose: 'Fire when a reader spends enough time or scrolls far enough to count as a meaningful read.',
    payload: ['article_slug', 'read_seconds', 'scroll_depth', 'person_id', 'session_id'],
    downstreamUse: 'Separates casual views from readers who should enter value-based follow-up journeys.',
  },
  {
    eventName: 'blog_scroll_depth',
    purpose: 'Track 25, 50, 75, and 90 percent scroll milestones for article quality and layout decisions.',
    payload: ['article_slug', 'depth_percent', 'cta_seen', 'sticky_cta_seen', 'session_id'],
    downstreamUse: 'Shows whether the sticky CTA, charts, and trust sections are being reached.',
  },
  {
    eventName: 'blog_cta_click',
    purpose: 'Capture every sticky CTA, inline CTA, footer CTA, partner CTA, referral CTA, and offer CTA click.',
    payload: ['article_slug', 'cta_id', 'cta_label', 'destination', 'person_id', 'campaign_id'],
    downstreamUse: 'Connects content to member starts, provider signups, offer claims, referrals, and testimonial flows.',
  },
  {
    eventName: 'blog_member_conversion',
    purpose: 'Tie a blog reader to account creation, portal start, or premium member activation.',
    payload: ['article_slug', 'member_id', 'source', 'campaign_id', 'language', 'conversion_window_days'],
    downstreamUse: 'Measures content-assisted member conversion and audience fit.',
  },
  {
    eventName: 'blog_client_conversion',
    purpose: 'Tie blog influence to a paid client, booked service, provider upgrade, or completed transaction.',
    payload: ['article_slug', 'client_id', 'product_id', 'invoice_id', 'amount', 'currency', 'attribution_model'],
    downstreamUse: 'Feeds attributed value, offer performance, product attach rate, and Empire Hub revenue reporting.',
  },
  {
    eventName: 'blog_attributed_value',
    purpose: 'Post a normalized revenue or credit value after the conversion is eligible for reporting.',
    payload: ['article_slug', 'amount', 'currency', 'source', 'campaign_id', 'partner_id', 'product_id'],
    downstreamUse: 'Powers top-value content rankings and campaign investment decisions.',
  },
];

export const BLOG_EDITORIAL_ACTION_QUEUE: BlogEditorialAction[] = [
  {
    action: 'Promote next',
    owner: 'Growth team',
    trigger: 'Article ranks top 10 for engaged reads or client conversions.',
    outcome: 'Feature it in Resend, partner share kits, social posts, and homepage education slots.',
  },
  {
    action: 'Update for trust',
    owner: 'Editorial lead',
    trigger: 'Article has strong views but scroll depth below 66 percent or weak CTA clicks.',
    outcome: 'Refresh opening promise, add proof, move charts higher, and clarify the next step.',
  },
  {
    action: 'Retarget engaged readers',
    owner: 'CRM automation',
    trigger: 'Reader completes engaged read but does not click a CTA or create an account.',
    outcome: 'Send value-based follow-up based on topic, app, language, and client/provider intent.',
  },
  {
    action: 'Build product recommendation',
    owner: 'Product revenue team',
    trigger: 'Article maps to a missing product layer on a known client profile.',
    outcome: 'Create an add-on recommendation, quote draft, or consultation CTA without pushy sales language.',
  },
  {
    action: 'Partner amplification',
    owner: 'Partner manager',
    trigger: 'Article matches a partner campaign, influencer category, or referral audience.',
    outcome: 'Attach partner link, QR, code, and track campaign-assisted conversions.',
  },
];
