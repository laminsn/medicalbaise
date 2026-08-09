import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BarChart3, BookOpen, CheckCircle2, ExternalLink, FileText, ShieldCheck } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BLOG_CONTENT_RATIO, getBlogPostBySlug, getRelatedBlogPosts } from '@/content/baiseBlogPosts';
import { getBaiseAppKey, getBaiseAppUrl } from '@/lib/providerCommunication';

const brandNames = {
  casa: 'Casa Baise',
  legal: 'Legal Baise',
  medical: 'MD Baise',
} as const;

const BlogPost = () => {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const post = getBlogPostBySlug(slug);
  const appKey = getBaiseAppKey();
  const brandName = brandNames[appKey];

  if (!post) return <Navigate to="/blog" replace />;

  const canonicalUrl = new URL(location.pathname, getBaiseAppUrl()).toString();
  const relatedPosts = getRelatedBlogPosts(post);
  const maxChartValue = Math.max(...post.chartData.map((item) => item.value), 1);
  const primaryCta = post.audience === 'provider' ? '/provider-dashboard' : '/browse';
  const secondaryCta = post.audience === 'provider' ? '/services-settings' : '/post-job';

  return (
    <AppLayout>
      <Helmet>
        <title>{post.title} | {brandName}</title>
        <meta name="description" content={post.deck} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.deck} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content={brandName} />
      </Helmet>

      <section className="border-b bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6 lg:py-16">
          <Link to="/blog" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-white/75 hover:text-white">
            <ArrowLeft className="h-4 w-4" />{t('pageCopy.backToLearningLibrary', "Back to learning library")}</Link>
          <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
            <div>
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
                  {post.audience === 'provider' ? 'For service providers' : 'For clients'}
                </Badge>
                <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
                  {post.niche === 'cross-platform' ? 'Baise platform' : post.niche}
                </Badge>
                <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
                  Article {String(post.number).padStart(2, '0')}
                </Badge>
              </div>
              <h1 className="max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">{post.title}</h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-white/75">{post.deck}</p>
            </div>

            <div className="rounded-lg border border-white/15 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">{t('pageCopy.articleFormat', "Article format")}</p>
              <div className="mt-5 space-y-3">
                {BLOG_CONTENT_RATIO.map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between text-xs text-white/75">
                      <span>{item.label}</span>
                      <span>{item.value}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/15">
                      <div className="h-2 rounded-full bg-emerald-300" style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/30">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-6">
          <article className="space-y-6">
            <section className="rounded-lg border bg-card p-6 shadow-sm md:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Story</p>
              <h2 className="mt-3 text-2xl font-bold text-foreground">{t('pageCopy.whyThisMattersNow', "Why this matters now")}</h2>
              <p className="mt-4 text-base leading-8 text-muted-foreground">{post.story}</p>
            </section>

            <section className="rounded-lg border bg-card p-6 shadow-sm md:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Lesson</p>
              <h2 className="mt-3 text-2xl font-bold text-foreground">{t('pageCopy.thePracticalTakeaway', "The practical takeaway")}</h2>
              <p className="mt-4 text-base leading-8 text-muted-foreground">{post.lesson}</p>
              <div className="mt-6 rounded-lg border bg-muted/40 p-5">
                <p className="font-semibold text-foreground">{t('pageCopy.howBaiseSupportsIt', "How Baise supports it")}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{post.strategy}</p>
              </div>
            </section>

            <section className="rounded-lg border bg-card p-6 shadow-sm md:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{t('pageCopy.actionPlan', "Action plan")}</p>
              <h2 className="mt-3 text-2xl font-bold text-foreground">{t('pageCopy.fourStepsToUseThis', "Four steps to use this today")}</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {post.actions.map((action, index) => (
                  <div key={action} className="rounded-lg border bg-background p-4">
                    <div className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">Step {index + 1}</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{action}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border bg-card p-6 shadow-sm md:p-8">
              <div className="flex items-start gap-3">
                <BarChart3 className="mt-1 h-6 w-6 text-primary" />
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{t('pageCopy.dataAndChart', "Data and chart")}</p>
                  <h2 className="mt-3 text-2xl font-bold text-foreground">{post.chartTitle}</h2>
                </div>
              </div>
              <p className="mt-4 text-base leading-8 text-muted-foreground">{post.dataNarrative}</p>
              <div className="mt-7 space-y-5">
                {post.chartData.map((item) => {
                  const width = Math.max(8, Math.round((item.value / maxChartValue) * 100));
                  return (
                    <div key={item.label}>
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <span className="text-sm font-medium text-foreground">{item.label}</span>
                        <span className="text-sm font-bold text-primary">{item.display}</span>
                      </div>
                      <div className="h-3 rounded-full bg-muted">
                        <div className="h-3 rounded-full bg-primary" style={{ width: `${width}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-lg border bg-card p-6 shadow-sm md:p-8">
              <div className="flex items-start gap-3">
                <FileText className="mt-1 h-6 w-6 text-primary" />
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Resources</p>
                  <h2 className="mt-3 text-2xl font-bold text-foreground">{t('pageCopy.sourcesAndReferencePoints', "Sources and reference points")}</h2>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">{t('pageCopy.theseReferencesInformTheArticle', "These references inform the article. They should be reviewed before using a post in paid advertising, legal, medical, accounting, or other regulated communications.")}</p>
              <div className="mt-6 grid gap-3">
                {post.sources.map((source) => (
                  <a
                    key={source.key}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-start justify-between gap-4 rounded-lg border bg-background p-4 text-sm transition hover:border-primary/40 hover:bg-primary/5"
                  >
                    <span>
                      <span className="block font-semibold text-foreground">{source.label}</span>
                      <span className="mt-1 block text-muted-foreground">{source.publisher}</span>
                    </span>
                    <ExternalLink className="h-4 w-4 shrink-0 text-primary" />
                  </a>
                ))}
              </div>
            </section>

            <section className="rounded-lg border bg-card p-6 shadow-sm md:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{t('pageCopy.recommendedNextReads', "Recommended next reads")}</p>
              <h2 className="mt-3 text-2xl font-bold text-foreground">{t('pageCopy.keepBuildingClarity', "Keep building clarity")}</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {relatedPosts.map((related) => (
                  <Link key={related.id} to={`/blog/${related.slug}`} className="rounded-lg border bg-background p-4 transition hover:border-primary/40 hover:bg-primary/5">
                    <Badge variant="outline">{related.audience === 'provider' ? 'Provider' : 'Client'}</Badge>
                    <h3 className="mt-3 text-sm font-semibold leading-6 text-foreground">{related.title}</h3>
                    <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-primary">{t('pageCopy.readGuide', "Read guide")}<ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </article>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border bg-card p-5 shadow-sm">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                {post.audience === 'provider' ? 'Provider next step' : 'Client next step'}
              </p>
              <h2 className="mt-3 text-2xl font-bold text-foreground">{post.ctaTitle}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{post.ctaText}</p>
              <div className="mt-5 grid gap-3">
                <Button asChild className="w-full">
                  <Link to={primaryCta}>
                    {post.audience === 'provider' ? 'Open provider dashboard' : 'Find trusted help'}
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to={secondaryCta}>
                    {post.audience === 'provider' ? 'Manage services' : 'Post a service request'}
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="w-full">
                  <Link to="/blog">
                    <BookOpen className="mr-2 h-4 w-4" />{t('pageCopy.browseAllGuides', "Browse all guides")}</Link>
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </AppLayout>
  );
};

export default BlogPost;
