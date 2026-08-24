import { CLIENT_BLOG_POSTS, PROVIDER_BLOG_POSTS, type BaiseBlogPost, type BlogAudience } from './baiseBlogPosts';

export type CampaignChannel = 'email' | 'push' | 'whatsapp' | 'sms';
export type CampaignAudience = BlogAudience | 'partner' | 'all';
export type SocialFormat = 'story' | 'facebook_post' | 'instagram_post';
export type CampaignKind = 'blog_weekly' | 'promo_launch' | 'promo_announcement';

export type QuoteReminder = {
  attribution: string;
  line: string;
};

export type ChannelAsset = {
  channel: CampaignChannel;
  subject: string;
  preview: string;
  body: string[];
  ctaLabel: string;
  ctaPath: string;
  deliveryPolicy: 'marketing';
};

export type SocialAsset = {
  format: SocialFormat;
  sizeLabel: string;
  headline: string;
  caption: string;
  visualPrompt: string;
  ctaPath: string;
};

export type AudienceCampaign = {
  audience: CampaignAudience;
  post: BaiseBlogPost;
  productName: string;
  productKey: string;
  valueReason: string;
  ctaLabel: string;
  ctaPath: string;
  quote: QuoteReminder;
  channels: ChannelAsset[];
  social: SocialAsset[];
};

export type WeeklyBlogCampaign = {
  id: string;
  campaignKey: string;
  kind: 'blog_weekly';
  weekNumber: number;
  scheduledAt: string;
  timezone: 'America/Sao_Paulo';
  cadence: 'weekly';
  title: string;
  description: string;
  audiences: AudienceCampaign[];
};

export type PromoCampaign = {
  id: string;
  campaignKey: string;
  kind: 'promo_launch' | 'promo_announcement';
  audience: CampaignAudience;
  scheduledAt: string;
  timezone: 'America/Sao_Paulo';
  title: string;
  description: string;
  landingPage: string;
  promoKey: string;
  productName: string;
  valueReason: string;
  channels: ChannelAsset[];
  social: SocialAsset[];
  rules: string[];
};

export const BLOG_CAMPAIGN_START_ISO = '2026-07-14T12:00:00.000Z';
export const BLOG_CAMPAIGN_START_LABEL = 'Tuesday, July 14, 2026 at 9:00 AM';
export const BLOG_CAMPAIGN_TIMEZONE = 'America/Sao_Paulo' as const;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const startTime = new Date(BLOG_CAMPAIGN_START_ISO).getTime();

const quoteBank: QuoteReminder[] = [
  { attribution: 'Warren Buffett', line: 'Value matters more than the sticker price.' },
  { attribution: 'Peter Drucker', line: 'What gets measured gets improved.' },
  { attribution: 'Oprah Winfrey', line: 'Great service begins with real understanding.' },
  { attribution: 'Steve Jobs', line: 'The best work feels simple for the person using it.' },
  { attribution: 'Sara Blakely', line: 'Growth comes from solving a real frustration well.' },
  { attribution: 'Richard Branson', line: 'People remember how clearly you helped them.' },
  { attribution: 'Mary Barra', line: 'Trust grows when standards and follow-through match.' },
  { attribution: 'Indra Nooyi', line: 'The strongest brands make people feel considered.' },
];

const socialSizes: Record<SocialFormat, string> = {
  story: '1080 x 1920 story',
  facebook_post: '1200 x 630 Facebook post',
  instagram_post: '1080 x 1080 Instagram post',
};

function scheduledAtForWeek(weekIndex: number) {
  return new Date(startTime + weekIndex * WEEK_MS).toISOString();
}

function articlePath(post: BaiseBlogPost) {
  return `/blog/${post.slug}`;
}

function cleanSentence(value: string) {
  return value.replace(/\.$/, '');
}

function audienceLabel(audience: CampaignAudience) {
  if (audience === 'provider') return 'service providers';
  if (audience === 'client') return 'people looking for trusted help';
  if (audience === 'partner') return 'partners and creators';
  return 'the Baise community';
}

function productTieIn(post: BaiseBlogPost) {
  if (post.audience === 'provider') {
    return {
      productKey: 'provider_revenue_suite',
      productName: 'Provider Revenue Suite',
      ctaLabel: 'Turn this into a provider workflow',
      ctaPath: '/auth?mode=signup&role=provider',
      valueReason:
        'Use Baise to manage requests, quotes, bookings, invoices, payment records, reviews, and campaigns without leaving the platform.',
    };
  }

  if (post.niche === 'medical') {
    return {
      productKey: 'medical_premium_access',
      productName: 'Medical Baise Premium Access',
      ctaLabel: 'Find trusted medical support',
      ctaPath: '/auth?mode=signup',
      valueReason:
        'Premium access helps you compare care, keep medical records organized, and follow up with less confusion.',
    };
  }

  if (post.niche === 'legal') {
    return {
      productKey: 'legal_client_care',
      productName: 'Legal Baise Client Care',
      ctaLabel: 'Find trusted legal support',
      ctaPath: '/auth?mode=signup',
      valueReason:
        'Legal Baise helps you keep documents, invoices, consultation notes, and next steps in one organized record.',
    };
  }

  return {
    productKey: 'client_premium_access',
    productName: 'Baise Premium Access',
    ctaLabel: 'Find a trusted provider',
    ctaPath: '/auth?mode=signup',
    valueReason:
      'Premium access makes it easier to compare trusted providers, keep receipts, and manage every service history in one place.',
  };
}

function quoteFor(index: number) {
  return quoteBank[index % quoteBank.length];
}

function emailAsset(post: BaiseBlogPost, weekNumber: number, quote: QuoteReminder): ChannelAsset {
  const tieIn = productTieIn(post);
  const audience = audienceLabel(post.audience);
  return {
    channel: 'email',
    subject: `This week's Baise guide: ${post.title}`,
    preview: `${cleanSentence(post.promise)}. A practical guide for ${audience}.`,
    body: [
      `Hi there, this week's Baise guide is built around a real question: ${post.title}`,
      `The practical takeaway is simple: ${cleanSentence(post.promise)}. The article walks through what to check, what to document, and how to avoid turning an important service decision into scattered messages.`,
      `Inside Baise, the tie-in is ${post.platformUse}. That means the advice is not just theory. It connects directly to the way a client or provider can keep proof, payments, communication, and next steps organized.`,
      `${quote.attribution}'s business reminder for this week: ${quote.line}`,
      `Recommended next step: ${tieIn.valueReason}`,
    ],
    ctaLabel: 'Read the weekly guide',
    ctaPath: articlePath(post),
    deliveryPolicy: 'marketing',
  };
}

function pushAsset(post: BaiseBlogPost): ChannelAsset {
  return {
    channel: 'push',
    subject: 'This week on Baise',
    preview: post.title,
    body: [`${post.title}. ${cleanSentence(post.promise)}. Tap to read the guide.`],
    ctaLabel: 'Read guide',
    ctaPath: articlePath(post),
    deliveryPolicy: 'marketing',
  };
}

function whatsappAsset(post: BaiseBlogPost, quote: QuoteReminder): ChannelAsset {
  const tieIn = productTieIn(post);
  return {
    channel: 'whatsapp',
    subject: 'Baise weekly guide',
    preview: post.title,
    body: [
      `This week's Baise guide: ${post.title}`,
      `${cleanSentence(post.promise)}.`,
      `Useful reminder from ${quote.attribution}: ${quote.line}`,
      `Value tie-in: ${tieIn.valueReason}`,
      `Read it here: ${articlePath(post)}`,
    ],
    ctaLabel: 'Read guide',
    ctaPath: articlePath(post),
    deliveryPolicy: 'marketing',
  };
}

function smsAsset(post: BaiseBlogPost): ChannelAsset {
  return {
    channel: 'sms',
    subject: 'Baise weekly guide',
    preview: post.title,
    body: [`Baise guide: ${post.title}. Read it here: ${articlePath(post)}`],
    ctaLabel: 'Read',
    ctaPath: articlePath(post),
    deliveryPolicy: 'marketing',
  };
}

function socialAssets(post: BaiseBlogPost): SocialAsset[] {
  const tieIn = productTieIn(post);
  const headline = post.audience === 'provider' ? 'Grow with better systems' : 'Choose trusted help with confidence';
  const captionCore = `${post.title}. ${cleanSentence(post.promise)}. Read the weekly Baise guide and see how ${tieIn.productName} adds practical value.`;

  return [
    {
      format: 'story',
      sizeLabel: socialSizes.story,
      headline,
      caption: `${captionCore} Swipe or tap to read.`,
      visualPrompt:
        'Clean Baise branded story layout with one strong headline, subtle trust badge, article title, and a clear read-now call to action.',
      ctaPath: articlePath(post),
    },
    {
      format: 'facebook_post',
      sizeLabel: socialSizes.facebook_post,
      headline: post.title,
      caption: `${captionCore} Practical, calm, and built for people who want the service record to be clear from the first step.`,
      visualPrompt:
        'Facebook link-share graphic using Baise colors, article headline, small platform logo, and a simple chart or checklist motif tied to the article topic.',
      ctaPath: articlePath(post),
    },
    {
      format: 'instagram_post',
      sizeLabel: socialSizes.instagram_post,
      headline,
      caption: `${captionCore}\n\n#Baise #TrustedProviders #BrazilServices #ServiceBusiness #ClientCare`,
      visualPrompt:
        'Square Instagram educational post with confident headline, three short value bullets, Baise logo, and high-contrast CTA area.',
      ctaPath: articlePath(post),
    },
  ];
}

function buildAudienceCampaign(post: BaiseBlogPost, weekNumber: number, offset: number): AudienceCampaign {
  const tieIn = productTieIn(post);
  const quote = quoteFor(weekNumber + offset);
  return {
    audience: post.audience,
    post,
    productName: tieIn.productName,
    productKey: tieIn.productKey,
    valueReason: tieIn.valueReason,
    ctaLabel: tieIn.ctaLabel,
    ctaPath: tieIn.ctaPath,
    quote,
    channels: [emailAsset(post, weekNumber, quote), pushAsset(post), whatsappAsset(post, quote), smsAsset(post)],
    social: socialAssets(post),
  };
}

export const BLOG_WEEKLY_CAMPAIGNS: WeeklyBlogCampaign[] = PROVIDER_BLOG_POSTS.map((providerPost, index) => {
  const clientPost = CLIENT_BLOG_POSTS[index];
  const weekNumber = index + 1;
  return {
    id: `blog-week-${String(weekNumber).padStart(2, '0')}`,
    campaignKey: `baise_blog_week_${String(weekNumber).padStart(2, '0')}`,
    kind: 'blog_weekly',
    weekNumber,
    scheduledAt: scheduledAtForWeek(index),
    timezone: BLOG_CAMPAIGN_TIMEZONE,
    cadence: 'weekly',
    title: `Week ${weekNumber}: ${providerPost.category} + ${clientPost.category}`,
    description:
      'Weekly Tuesday 9 a.m. blog campaign with provider and client email, push, WhatsApp, SMS, and social creative prompts.',
    audiences: [
      buildAudienceCampaign(providerPost, weekNumber, 0),
      buildAudienceCampaign(clientPost, weekNumber, 4),
    ],
  };
});

function promoChannelAssets(input: {
  title: string;
  landingPage: string;
  audience: CampaignAudience;
  valueReason: string;
  ctaLabel: string;
  quote: QuoteReminder;
}): ChannelAsset[] {
  return [
    {
      channel: 'email',
      subject: input.title,
      preview: input.valueReason,
      body: [
        `Hi there, ${input.title.toLowerCase()} is now live for ${audienceLabel(input.audience)}.`,
        input.valueReason,
        `${input.quote.attribution}'s reminder for this campaign: ${input.quote.line}`,
        'The goal is not noise. It is simple value: better access, cleaner tracking, stronger trust, and a reason for people to take the next right step.',
      ],
      ctaLabel: input.ctaLabel,
      ctaPath: input.landingPage,
      deliveryPolicy: 'marketing',
    },
    {
      channel: 'push',
      subject: input.title,
      preview: input.valueReason,
      body: [`${input.title}. ${input.valueReason}`],
      ctaLabel: input.ctaLabel,
      ctaPath: input.landingPage,
      deliveryPolicy: 'marketing',
    },
    {
      channel: 'whatsapp',
      subject: input.title,
      preview: input.valueReason,
      body: [
        input.title,
        input.valueReason,
        `Open the campaign page: ${input.landingPage}`,
      ],
      ctaLabel: input.ctaLabel,
      ctaPath: input.landingPage,
      deliveryPolicy: 'marketing',
    },
    {
      channel: 'sms',
      subject: input.title,
      preview: input.valueReason,
      body: [`${input.title}. ${input.ctaLabel}: ${input.landingPage}`],
      ctaLabel: input.ctaLabel,
      ctaPath: input.landingPage,
      deliveryPolicy: 'marketing',
    },
  ];
}

function promoSocialAssets(input: { title: string; landingPage: string; valueReason: string; tag: string }): SocialAsset[] {
  return [
    {
      format: 'story',
      sizeLabel: socialSizes.story,
      headline: input.title,
      caption: `${input.valueReason} Tap to learn more.`,
      visualPrompt:
        'Premium Baise story creative with focused headline, campaign benefit, simple proof badge, and clear CTA.',
      ctaPath: input.landingPage,
    },
    {
      format: 'facebook_post',
      sizeLabel: socialSizes.facebook_post,
      headline: input.title,
      caption: `${input.valueReason} Learn how the campaign works and use your next step inside Baise.`,
      visualPrompt:
        'Clean Facebook promotional graphic with Baise logo, campaign name, one value statement, and campaign CTA.',
      ctaPath: input.landingPage,
    },
    {
      format: 'instagram_post',
      sizeLabel: socialSizes.instagram_post,
      headline: input.title,
      caption: `${input.valueReason}\n\n#Baise #${input.tag} #BrazilServices #TrustedHelp`,
      visualPrompt:
        'Square Instagram campaign graphic with strong benefit headline, compact rules, and a premium but practical visual style.',
      ctaPath: input.landingPage,
    },
  ];
}

export const PROMO_CAMPAIGNS: PromoCampaign[] = [
  {
    id: 'influencer-partners-launch',
    campaignKey: 'influencer_partners_launch',
    kind: 'promo_launch',
    audience: 'partner',
    scheduledAt: scheduledAtForWeek(0),
    timezone: BLOG_CAMPAIGN_TIMEZONE,
    title: 'Influencer Partners is open for applications',
    description:
      'Launch campaign for Brazil-based creators with 5,000+ followers who want to help audiences find trusted service, legal, and medical support.',
    landingPage: '/influencer-partners',
    promoKey: 'influencer_partners',
    productName: 'Baise Influencer Partner Program',
    valueReason:
      'Approved creators can earn for approved posts, viral-view benchmarks, and tracked premium conversions while giving their audience a useful Baise offer.',
    channels: promoChannelAssets({
      title: 'Influencer Partners is open for applications',
      landingPage: '/influencer-partners',
      audience: 'partner',
      valueReason:
        'Approved creators can earn for approved posts, viral-view benchmarks, and tracked premium conversions while giving their audience a useful Baise offer.',
      ctaLabel: 'Apply to partner',
      quote: quoteFor(1),
    }),
    social: promoSocialAssets({
      title: 'Influencer Partners',
      landingPage: '/influencer-partners',
      valueReason: 'Create useful content, help people find trusted support, and earn from tracked results.',
      tag: 'InfluencerPartners',
    }),
    rules: [
      'Minimum 5,000 followers.',
      'Minimum two and maximum four posts per month.',
      '{{amount}} for approved posts, plus {{amount}} after 10,000+ views.',
      'Tracked commission after eligible premium or service-client retention milestones.',
      'Applications reviewed within 48 hours.',
    ],
  },
  {
    id: 'give-month-launch',
    campaignKey: 'give_a_month_get_a_month_launch',
    kind: 'promo_launch',
    audience: 'all',
    scheduledAt: scheduledAtForWeek(0),
    timezone: BLOG_CAMPAIGN_TIMEZONE,
    title: 'Give a Month, Get a Month is live',
    description:
      'Launch campaign for current clients, service seekers, and service providers who refer premium-level users during July and August.',
    landingPage: '/give-a-month-get-a-month',
    promoKey: 'give_a_month_get_a_month',
    productName: 'Premium Referral Credit',
    valueReason:
      'Premium users can earn one free month for each eligible premium referral, up to 12 free months in a calendar year.',
    channels: promoChannelAssets({
      title: 'Give a Month, Get a Month is live',
      landingPage: '/give-a-month-get-a-month',
      audience: 'all',
      valueReason:
        'Premium users can earn one free month for each eligible premium referral, up to 12 free months in a calendar year.',
      ctaLabel: 'Share your referral',
      quote: quoteFor(2),
    }),
    social: promoSocialAssets({
      title: 'Give a Month, Get a Month',
      landingPage: '/give-a-month-get-a-month',
      valueReason: 'Refer someone who needs Baise, and earn free premium time when they upgrade.',
      tag: 'ReferralRewards',
    }),
    rules: [
      'Runs through July and August.',
      'Eligible for premium-level users.',
      'One free month per eligible premium referral.',
      'Maximum 12 free months per calendar year.',
      'Tracked through unique link, QR code, referral code, and client ID.',
    ],
  },
  {
    id: 'influencer-partners-announcement',
    campaignKey: 'influencer_partners_announcement',
    kind: 'promo_announcement',
    audience: 'partner',
    scheduledAt: scheduledAtForWeek(1),
    timezone: BLOG_CAMPAIGN_TIMEZONE,
    title: 'Creator reminder: Baise influencer applications are being reviewed',
    description:
      'Announcement reminder for creators who can make original content that helps people find trusted providers.',
    landingPage: '/influencer-partners',
    promoKey: 'influencer_partners',
    productName: 'Baise Influencer Partner Program',
    valueReason:
      'If your audience asks where to find trustworthy help, Baise gives you a practical campaign, a tracked link, and a clear way to earn.',
    channels: promoChannelAssets({
      title: 'Creator reminder: Baise influencer applications are being reviewed',
      landingPage: '/influencer-partners',
      audience: 'partner',
      valueReason:
        'If your audience asks where to find trustworthy help, Baise gives you a practical campaign, a tracked link, and a clear way to earn.',
      ctaLabel: 'Apply within 48-hour review',
      quote: quoteFor(3),
    }),
    social: promoSocialAssets({
      title: 'Creator applications open',
      landingPage: '/influencer-partners',
      valueReason: 'Bring your audience a useful service discovery tool and earn from approved tracked results.',
      tag: 'InfluencerPartners',
    }),
    rules: [
      'Original content required.',
      'Free first month or no first transaction service fee for eligible tracked users.',
      'Creator links, QR codes, and unique codes track performance.',
      'Month-to-month agreement.',
    ],
  },
  {
    id: 'give-month-announcement',
    campaignKey: 'give_a_month_get_a_month_announcement',
    kind: 'promo_announcement',
    audience: 'all',
    scheduledAt: scheduledAtForWeek(1),
    timezone: BLOG_CAMPAIGN_TIMEZONE,
    title: 'Your Baise referral can pay for your next premium month',
    description:
      'Announcement reminder for current clients and providers to share Baise with family, friends, colleagues, and clients.',
    landingPage: '/give-a-month-get-a-month',
    promoKey: 'give_a_month_get_a_month',
    productName: 'Premium Referral Credit',
    valueReason:
      'Give someone a trusted way to find help and earn a free premium month when their eligible premium registration is confirmed.',
    channels: promoChannelAssets({
      title: 'Your Baise referral can pay for your next premium month',
      landingPage: '/give-a-month-get-a-month',
      audience: 'all',
      valueReason:
        'Give someone a trusted way to find help and earn a free premium month when their eligible premium registration is confirmed.',
      ctaLabel: 'Open referral campaign',
      quote: quoteFor(4),
    }),
    social: promoSocialAssets({
      title: 'Refer trusted help',
      landingPage: '/give-a-month-get-a-month',
      valueReason: 'Share Baise and earn premium credit when your referral upgrades.',
      tag: 'ReferralRewards',
    }),
    rules: [
      'Referral must register for an eligible premium level.',
      'Credit appears after eligibility is confirmed.',
      'Referral tracking uses link, QR code, code, and client ID.',
      'Maximum one year of free premium credit.',
    ],
  },
];

export const CONTENT_CAMPAIGN_SUMMARY = {
  weeklyCampaigns: BLOG_WEEKLY_CAMPAIGNS.length,
  blogEmailCampaigns: BLOG_WEEKLY_CAMPAIGNS.length * 2,
  blogChannelAssets: BLOG_WEEKLY_CAMPAIGNS.length * 2 * 4,
  blogSocialAssets: BLOG_WEEKLY_CAMPAIGNS.length * 2 * 3,
  promoCampaigns: PROMO_CAMPAIGNS.length,
  promoChannelAssets: PROMO_CAMPAIGNS.length * 4,
  promoSocialAssets: PROMO_CAMPAIGNS.length * 3,
};
