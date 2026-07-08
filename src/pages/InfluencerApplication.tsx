import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { InfluencerCampaignShell } from '@/components/partner/InfluencerCampaignShell';
import { PageMetadata } from '@/components/seo/PageMetadata';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { getBaiseAppKey } from '@/lib/providerCommunication';
import { SeoLocale, localizedPublicPath, normalizeSeoLocale } from '@/lib/publicPageSeo';

type PlatformRow = {
  platform: string;
  handle: string;
  profile_url: string;
  followers: string;
  average_views: string;
  engagement_rate: string;
};

type StoredApplication = {
  application_id?: string;
  application_token?: string;
  payload?: Record<string, unknown>;
};

type SubmitResult = {
  application_id: string;
  application_token: string;
  application_status: string;
  review_due_at: string;
};

const db = supabase as any;

const brandName = {
  casa: 'Casa Baise',
  medical: 'Medical Baise',
  legal: 'Legal Baise',
} as const;

const campaignOptions = [
  { id: 'brazil_influencer', label: 'Brazil influencer campaign' },
  { id: 'services', label: 'Service providers' },
  { id: 'legal', label: 'Legal support' },
  { id: 'medical', label: 'Medical support' },
  { id: 'international', label: 'International clients' },
  { id: 'national_brazil', label: 'National Brazil audience' },
];

const languageOptions = ['English', 'Portuguese', 'Spanish', 'French', 'Arabic', 'Other'];
const locationOptions = ['Brazil', 'United States', 'Europe', 'Latin America', 'Africa', 'Global', 'Other'];

const emptyPlatform: PlatformRow = {
  platform: 'instagram',
  handle: '',
  profile_url: '',
  followers: '',
  average_views: '',
  engagement_rate: '',
};

const initialForm = {
  full_name: '',
  creator_name: '',
  email: '',
  phone: '',
  country: '',
  city: '',
  primary_platform: 'instagram',
  primary_handle: '',
  primary_profile_url: '',
  total_followers: '',
  creator_bio: '',
  audience_summary: '',
  main_demographic: '',
  content_niche: '',
  average_views: '',
  thirty_day_reach: '',
  viral_posts_count: '',
  conversion_experience: '',
  payout_notes: '',
  content_examples: '',
  why_baise: '',
};

type InfluencerApplicationProps = {
  defaultLocale?: SeoLocale;
};

export default function InfluencerApplication({ defaultLocale }: InfluencerApplicationProps) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const appKey = getBaiseAppKey();
  const locale = defaultLocale || normalizeSeoLocale(i18n.resolvedLanguage || i18n.language);
  const campaignPath = localizedPublicPath('/influencer-partners', locale);
  const applicationPath = localizedPublicPath('/influencer-application', locale);
  const [form, setForm] = useState(initialForm);
  const [platforms, setPlatforms] = useState<PlatformRow[]>([{ ...emptyPlatform }]);
  const [campaignInterests, setCampaignInterests] = useState<string[]>(['brazil_influencer']);
  const [audienceLanguages, setAudienceLanguages] = useState<string[]>(['English']);
  const [audienceLocations, setAudienceLocations] = useState<string[]>(['Brazil']);
  const [certified, setCertified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReviewDue, setSubmittedReviewDue] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(searchParams.get('application'));
  const [applicationToken, setApplicationToken] = useState<string | null>(searchParams.get('token'));

  useEffect(() => {
    if (!defaultLocale) return;
    const current = (i18n.resolvedLanguage || i18n.language || '').toLowerCase();
    if (!current.startsWith(defaultLocale)) {
      void i18n.changeLanguage(defaultLocale);
    }
  }, [defaultLocale, i18n]);

  useEffect(() => {
    const storedRaw = sessionStorage.getItem('baise_influencer_application');
    if (!storedRaw) return;

    try {
      const stored = JSON.parse(storedRaw) as StoredApplication;
      if (!applicationId && stored.application_id) setApplicationId(stored.application_id);
      if (!applicationToken && stored.application_token) setApplicationToken(stored.application_token);
      const payload = stored.payload || {};
      setForm((current) => ({
        ...current,
        full_name: String(payload.full_name || current.full_name),
        email: String(payload.email || current.email),
        phone: String(payload.phone || current.phone),
        primary_platform: String(payload.primary_platform || current.primary_platform),
        primary_handle: String(payload.primary_handle || current.primary_handle),
        total_followers: String(payload.total_followers || current.total_followers),
      }));
      setPlatforms((current) => [{
        ...current[0],
        platform: String(payload.primary_platform || current[0].platform),
        handle: String(payload.primary_handle || current[0].handle),
        followers: String(payload.total_followers || current[0].followers),
      }]);
    } catch {
      sessionStorage.removeItem('baise_influencer_application');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalFollowers = useMemo(() => {
    const platformTotal = platforms.reduce((sum, platform) => sum + toNumber(platform.followers), 0);
    return Math.max(toNumber(form.total_followers), platformTotal);
  }, [form.total_followers, platforms]);

  const updateForm = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updatePlatform = (index: number, key: keyof PlatformRow, value: string) => {
    setPlatforms((current) => current.map((platform, rowIndex) => (
      rowIndex === index ? { ...platform, [key]: value } : platform
    )));
  };

  const addPlatform = () => {
    setPlatforms((current) => [...current, { ...emptyPlatform }]);
  };

  const removePlatform = (index: number) => {
    setPlatforms((current) => current.length === 1 ? current : current.filter((_, rowIndex) => rowIndex !== index));
  };

  const toggleListValue = (value: string, current: string[], setter: (value: string[]) => void) => {
    setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const submitApplication = async (event: FormEvent) => {
    event.preventDefault();

    if (!form.full_name.trim() || !form.email.trim() || !form.creator_bio.trim()) {
      toast.error('Add your name, email, and creator bio.');
      return;
    }

    if (totalFollowers < 5000) {
      toast.error('A minimum of 5,000 followers across platforms is required.');
      return;
    }

    if (!form.audience_summary.trim() || !form.main_demographic.trim()) {
      toast.error('Add audience summary and main demographic details.');
      return;
    }

    if (!certified) {
      toast.error('Confirm the influencer partner requirements before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const contentExamples = form.content_examples
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((url) => ({ url }));

      const payload = {
        ...form,
        total_followers: totalFollowers,
        platforms: platforms.map((platform) => ({
          ...platform,
          followers: toNumber(platform.followers),
          average_views: toNumber(platform.average_views),
          engagement_rate: platform.engagement_rate,
        })),
        campaign_interests: campaignInterests,
        audience_locations: audienceLocations,
        audience_languages: audienceLanguages,
        content_examples: contentExamples,
        metrics: {
          average_views: toNumber(form.average_views),
          thirty_day_reach: toNumber(form.thirty_day_reach),
          viral_posts_count: toNumber(form.viral_posts_count),
          conversion_experience: form.conversion_experience,
          why_baise: form.why_baise,
        },
        payout_preferences: {
          payout_notes: form.payout_notes,
          paid_per_post: true,
          currency: 'BRL',
          paid_per_post_amount: 150,
          monthly_posts_min: 2,
          monthly_posts_max: 4,
          viral_incentive_threshold: 10000,
          viral_incentive_amount: 150,
          commission_tracking_required: true,
          retained_conversion_months: 3,
          retained_conversion_commission_amount: 150,
          agreement_term: 'month_to_month',
          audience_offer: 'free_first_month_or_no_first_transaction_service_fee',
        },
      };

      const { data, error } = await db.rpc('submit_influencer_partner_application', {
        target_app_key: appKey,
        application_stage: 'application',
        application_payload: payload,
        existing_application_id: applicationId,
        existing_application_token: applicationToken,
      });

      if (error) throw error;

      const result = (Array.isArray(data) ? data[0] : data) as SubmitResult | undefined;
      setSubmittedReviewDue(result?.review_due_at || null);
      sessionStorage.removeItem('baise_influencer_application');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to submit application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedReviewDue) {
    return (
      <InfluencerCampaignShell brand={brandName[appKey]}>
        <PageMetadata page="influencer-application" locale={locale} path={applicationPath} />
        <div className="px-4 py-12">
          <div className="mx-auto max-w-2xl rounded-lg border border-white/12 bg-white/[0.06] p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/12 text-emerald-300">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight">Application submitted</h1>
            <p className="mt-3 text-sm leading-6 text-white/64">
              Your influencer partner application is in review. Qualified creators are reviewed within 48 hours. If approved, your campaign, tracking link, QR code, coupon code, rules, and performance dashboard will appear in your partner portal.
            </p>
            <div className="mt-6 grid gap-3 rounded-lg border border-white/12 bg-black/20 p-4 text-left text-sm text-white/68 sm:grid-cols-3">
              <span>R$150 post review</span>
              <span>10,000-view bonus eligibility</span>
              <span>Tracked commission setup</span>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild>
                <Link to="/partner-dashboard">Open partner dashboard</Link>
              </Button>
              <Button asChild variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                <Link to="/">Back to Baise</Link>
              </Button>
            </div>
          </div>
        </div>
      </InfluencerCampaignShell>
    );
  }

  return (
    <InfluencerCampaignShell brand={brandName[appKey]}>
      <PageMetadata page="influencer-application" locale={locale} path={applicationPath} />

        <form onSubmit={submitApplication} className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
          <main className="space-y-6">
            <Button type="button" variant="ghost" className="-ml-3 gap-2 text-white hover:bg-white/10 hover:text-white" onClick={() => navigate(campaignPath)}>
              <ArrowLeft className="h-4 w-4" />
              Back to campaign
            </Button>

            <section className="rounded-lg border border-white/12 bg-white/[0.06] p-5">
              <Badge className="rounded-md border-white/12 bg-white/10 text-white hover:bg-white/10">Step 2</Badge>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">Complete your influencer profile.</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/62 sm:text-base">
                Tell us who you are, who you influence, what platforms you use, and how your audience can benefit from trusted service, legal, and medical support through Baise.
              </p>
            </section>

            <Section title="Who you are" description="Give the review team a clear picture of you and your creator presence.">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Full name"><Input value={form.full_name} onChange={(event) => updateForm('full_name', event.target.value)} /></Field>
                <Field label="Creator or brand name"><Input value={form.creator_name} onChange={(event) => updateForm('creator_name', event.target.value)} placeholder="Optional" /></Field>
                <Field label="Email"><Input type="email" value={form.email} onChange={(event) => updateForm('email', event.target.value)} /></Field>
                <Field label="WhatsApp or phone"><Input value={form.phone} onChange={(event) => updateForm('phone', event.target.value)} /></Field>
                <Field label="Country"><Input value={form.country} onChange={(event) => updateForm('country', event.target.value)} /></Field>
                <Field label="City"><Input value={form.city} onChange={(event) => updateForm('city', event.target.value)} /></Field>
              </div>
              <Field label="Creator bio">
                <Textarea value={form.creator_bio} onChange={(event) => updateForm('creator_bio', event.target.value)} rows={5} placeholder="Who are you, what do you create, and why does your audience trust you?" />
              </Field>
            </Section>

            <Section title="Platforms and following" description="Add every active platform. Total followers must be at least 5,000 across platforms.">
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Primary platform">
                  <Select value={form.primary_platform} onValueChange={(value) => updateForm('primary_platform', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['instagram', 'tiktok', 'youtube', 'linkedin', 'facebook', 'x', 'podcast', 'newsletter', 'other'].map((platform) => (
                        <SelectItem key={platform} value={platform}>{platformLabel(platform)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Primary handle"><Input value={form.primary_handle} onChange={(event) => updateForm('primary_handle', event.target.value)} placeholder="@handle" /></Field>
                <Field label="Total followers"><Input value={form.total_followers} onChange={(event) => updateForm('total_followers', event.target.value)} placeholder="5000+" /></Field>
              </div>
              <Field label="Primary profile URL"><Input value={form.primary_profile_url} onChange={(event) => updateForm('primary_profile_url', event.target.value)} placeholder="https://..." /></Field>

              <div className="space-y-3">
                {platforms.map((platform, index) => (
                  <div key={`${platform.platform}-${index}`} className="rounded-lg border border-white/12 bg-black/20 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">Platform {index + 1}</p>
                      <Button type="button" variant="ghost" size="sm" className="gap-2 text-white hover:bg-white/10 hover:text-white" onClick={() => removePlatform(index)}>
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <Field label="Platform">
                        <Select value={platform.platform} onValueChange={(value) => updatePlatform(index, 'platform', value)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {['instagram', 'tiktok', 'youtube', 'linkedin', 'facebook', 'x', 'podcast', 'newsletter', 'other'].map((item) => (
                              <SelectItem key={item} value={item}>{platformLabel(item)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Handle"><Input value={platform.handle} onChange={(event) => updatePlatform(index, 'handle', event.target.value)} placeholder="@handle" /></Field>
                      <Field label="Followers"><Input value={platform.followers} onChange={(event) => updatePlatform(index, 'followers', event.target.value)} /></Field>
                      <Field label="Profile URL"><Input value={platform.profile_url} onChange={(event) => updatePlatform(index, 'profile_url', event.target.value)} /></Field>
                      <Field label="Average views"><Input value={platform.average_views} onChange={(event) => updatePlatform(index, 'average_views', event.target.value)} /></Field>
                      <Field label="Engagement rate"><Input value={platform.engagement_rate} onChange={(event) => updatePlatform(index, 'engagement_rate', event.target.value)} placeholder="Example: 4.8%" /></Field>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" className="gap-2 border-white/20 bg-transparent text-white hover:bg-white/10" onClick={addPlatform}>
                  <Plus className="h-4 w-4" />
                  Add another platform
                </Button>
              </div>
            </Section>

            <Section title="Audience and demographics" description="Help us understand who you serve and what problems your audience needs help solving.">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Main demographic"><Textarea value={form.main_demographic} onChange={(event) => updateForm('main_demographic', event.target.value)} rows={4} placeholder="Age range, location, profession, expats, families, business owners, etc." /></Field>
                <Field label="Audience summary"><Textarea value={form.audience_summary} onChange={(event) => updateForm('audience_summary', event.target.value)} rows={4} placeholder="Who follows you and why do they trust your recommendations?" /></Field>
              </div>
              <Field label="Content niche"><Input value={form.content_niche} onChange={(event) => updateForm('content_niche', event.target.value)} placeholder="Lifestyle, real estate, family, health, law, business, travel..." /></Field>
              <CheckGroup title="Audience locations" options={locationOptions} selected={audienceLocations} onToggle={(value) => toggleListValue(value, audienceLocations, setAudienceLocations)} />
              <CheckGroup title="Audience languages" options={languageOptions} selected={audienceLanguages} onToggle={(value) => toggleListValue(value, audienceLanguages, setAudienceLanguages)} />
            </Section>

            <Section title="Creator performance" description="Share the statistical details that matter for paid posts, viral incentives, and commission tracking.">
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Average views per post"><Input value={form.average_views} onChange={(event) => updateForm('average_views', event.target.value)} /></Field>
                <Field label="30-day reach"><Input value={form.thirty_day_reach} onChange={(event) => updateForm('thirty_day_reach', event.target.value)} /></Field>
                <Field label="Posts over 10,000 views"><Input value={form.viral_posts_count} onChange={(event) => updateForm('viral_posts_count', event.target.value)} /></Field>
              </div>
              <Field label="Conversion or partnership experience">
                <Textarea value={form.conversion_experience} onChange={(event) => updateForm('conversion_experience', event.target.value)} rows={4} placeholder="Past campaigns, affiliate links, lead generation, UGC, or brand partnerships." />
              </Field>
              <Field label="Content examples">
                <Textarea value={form.content_examples} onChange={(event) => updateForm('content_examples', event.target.value)} rows={4} placeholder="Paste one URL per line." />
              </Field>
            </Section>

            <Section title="Campaign fit" description="Tell us which Baise audiences you can help and why this partnership makes sense.">
              <CheckGroup title="Campaign interests" options={campaignOptions.map((option) => option.label)} selected={campaignInterests.map(labelFromCampaignId)} onToggle={(label) => {
                const option = campaignOptions.find((item) => item.label === label);
                if (option) toggleListValue(option.id, campaignInterests, setCampaignInterests);
              }} />
              <Field label="Why Baise?">
                <Textarea value={form.why_baise} onChange={(event) => updateForm('why_baise', event.target.value)} rows={4} placeholder="Why would your audience benefit from trusted service, legal, or medical discovery?" />
              </Field>
              <Field label="Payout notes">
                <Textarea value={form.payout_notes} onChange={(event) => updateForm('payout_notes', event.target.value)} rows={3} placeholder="Optional: preferred payout method, country, or invoicing notes." />
              </Field>
            </Section>
          </main>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-lg border border-white/12 bg-white p-5 text-[#101114] shadow-2xl">
              <div className="flex items-start gap-3">
                <span className="rounded-md bg-emerald-500/10 p-2 text-emerald-700">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Application review</p>
                  <p className="mt-1 text-xs leading-5 text-black/58">Qualified influencer applications are reviewed within 48 hours.</p>
                </div>
              </div>

              <div className="mt-5 space-y-3 rounded-lg bg-black/[0.04] p-4 text-sm">
                <SummaryRow label="Total followers" value={totalFollowers.toLocaleString()} strong={totalFollowers >= 5000} />
                <SummaryRow label="Platforms" value={String(platforms.length)} />
                <SummaryRow label="Campaign lanes" value={String(campaignInterests.length)} />
                <SummaryRow label="Post pay" value="R$150" />
                <SummaryRow label="Viral bonus" value="R$150 at 10,000 views" />
                <SummaryRow label="Post cadence" value="2-4 per month" />
              </div>

              <label className="mt-5 flex gap-3 rounded-lg border p-3 text-sm leading-5">
                <Checkbox checked={certified} onCheckedChange={(checked) => setCertified(checked === true)} className="mt-1" />
                <span>
                  I confirm I have at least 5,000 followers, can create original Baise content 2 to 4 times per month, and understand conversions must be tracked through my Baise link, QR code, or coupon code.
                </span>
              </label>

              <Button type="submit" disabled={isSubmitting} className="mt-5 h-11 w-full gap-2">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Submit for 48-hour review
              </Button>

              <p className="mt-4 text-center text-xs leading-5 text-black/48">
                Approval is required before R$150 post pay, viral incentives, commission links, QR codes, or coupon codes are activated.
              </p>
            </div>
          </aside>
        </form>
    </InfluencerCampaignShell>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-white/12 bg-white/[0.06] p-5">
      <div className="mb-5">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-white/58">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-white/86">{label}</Label>
      {children}
    </div>
  );
}

function CheckGroup({ title, options, selected, onToggle }: { title: string; options: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return (
    <div>
      <p className="mb-3 text-sm font-medium text-white/86">{title}</p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-3 rounded-md border border-white/12 bg-black/20 p-3 text-sm text-white/72">
            <Checkbox checked={selected.includes(option)} onCheckedChange={() => onToggle(option)} />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-black/58">{label}</span>
      <span className={strong ? 'font-semibold text-emerald-700' : 'font-semibold'}>{value}</span>
    </div>
  );
}

function toNumber(value: string) {
  return Number(String(value || '').replace(/[^0-9]/g, '')) || 0;
}

function platformLabel(value: string) {
  const labels: Record<string, string> = {
    instagram: 'Instagram',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    linkedin: 'LinkedIn',
    facebook: 'Facebook',
    x: 'X',
    podcast: 'Podcast',
    newsletter: 'Newsletter',
    other: 'Other',
  };
  return labels[value] || value;
}

function labelFromCampaignId(id: string) {
  return campaignOptions.find((option) => option.id === id)?.label || id;
}
