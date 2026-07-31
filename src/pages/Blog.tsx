import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, BookOpen, Briefcase, Filter, Search, ShieldCheck, Users } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BAISE_BLOG_POSTS, BLOG_CONTENT_RATIO, BlogAudience, BlogNiche } from '@/content/baiseBlogPosts';
import { getBaiseAppKey, getBaiseAppUrl } from '@/lib/providerCommunication';

const brandCopy = {
  casa: {
    name: 'Casa Baise',
    title: 'Casa Baise Learning Library',
    description: 'Educational guides for trusted home, property, and service support in Brazil.',
  },
  legal: {
    name: 'Legal Baise',
    title: 'Legal Baise Learning Library',
    description: 'Educational guides for trusted legal, business, property, and service support in Brazil.',
  },
  medical: {
    name: 'MD Baise',
    title: 'MD Baise Learning Library',
    description: 'Educational guides for trusted medical, wellness, and care support in Brazil.',
  },
} as const;

const audienceFilters: Array<{ value: 'all' | BlogAudience; label: string }> = [
  { value: 'all', label: 'All posts' },
  { value: 'provider', label: 'For providers' },
  { value: 'client', label: 'For clients' },
];

const nicheFilters: Array<{ value: 'all' | BlogNiche; label: string }> = [
  { value: 'all', label: 'All niches' },
  { value: 'casa', label: 'Casa' },
  { value: 'medical', label: 'Medical' },
  { value: 'legal', label: 'Legal' },
  { value: 'cross-platform', label: 'Platform' },
];

const Blog = () => {
  const location = useLocation();
  const appKey = getBaiseAppKey();
  const brand = brandCopy[appKey];
  const [query, setQuery] = useState('');
  const [audience, setAudience] = useState<'all' | BlogAudience>('all');
  const [niche, setNiche] = useState<'all' | BlogNiche>('all');

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return BAISE_BLOG_POSTS.filter((post) => {
      const matchesAudience = audience === 'all' || post.audience === audience;
      const matchesNiche = niche === 'all' || post.niche === niche;
      const matchesQuery =
        !normalizedQuery ||
        [post.title, post.deck, post.category, post.searchIntent, post.platformUse].join(' ').toLowerCase().includes(normalizedQuery);
      return matchesAudience && matchesNiche && matchesQuery;
    });
  }, [audience, niche, query]);

  const providerCount = BAISE_BLOG_POSTS.filter((post) => post.audience === 'provider').length;
  const clientCount = BAISE_BLOG_POSTS.filter((post) => post.audience === 'client').length;
  const canonicalUrl = new URL(location.pathname, getBaiseAppUrl()).toString();

  return (
    <AppLayout>
      <Helmet>
        <title>{brand.title} | {brand.name}</title>
        <meta name="description" content={`${brand.description} Browse 108 practical articles for providers and clients.`} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={brand.title} />
        <meta property="og:description" content={`${brand.description} Provider growth and client vetting education with charts, resources, and practical next steps.`} />
        <meta property="og:url" content={canonicalUrl} />
      </Helmet>

      <section className="bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:px-6 lg:py-20">
          <div>
            <Badge className="mb-5 border-white/20 bg-white/10 text-white hover:bg-white/10">
              108 educational articles
            </Badge>
            <h1 className="max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
              Practical Baise guides for better providers and smarter service decisions.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/75">
              A client-facing and provider-facing content library built around the way people actually search, compare,
              book, pay, document, review, and return for services in Brazil.
            </p>
            <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-white/15 bg-white/10 p-4">
                <p className="text-3xl font-bold">{providerCount}</p>
                <p className="text-sm text-white/70">provider growth posts</p>
              </div>
              <div className="rounded-lg border border-white/15 bg-white/10 p-4">
                <p className="text-3xl font-bold">{clientCount}</p>
                <p className="text-sm text-white/70">client vetting posts</p>
              </div>
              <div className="rounded-lg border border-white/15 bg-white/10 p-4">
                <p className="text-3xl font-bold">3</p>
                <p className="text-sm text-white/70">major service families</p>
              </div>
            </div>
          </div>

          <aside className="rounded-lg border border-white/15 bg-white/10 p-5 backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">Content mix</p>
            <p className="mt-3 text-2xl font-semibold">Helpful first. Trust-building always.</p>
            <p className="mt-3 text-sm leading-6 text-white/70">
              The format follows the established education pattern: useful story, practical lessons, platform workflow,
              supporting data, resources, and one clear next step.
            </p>
            <div className="mt-6 space-y-4">
              {BLOG_CONTENT_RATIO.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{item.label}</span>
                    <span>{item.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/15">
                    <div className="h-2 rounded-full bg-emerald-300" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="border-b bg-background">
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by topic, niche, client need, campaign, invoice, doctor, lawyer..."
                className="h-12 pl-11"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {audienceFilters.map((filter) => (
                <Button
                  key={filter.value}
                  type="button"
                  variant={audience === filter.value ? 'default' : 'outline'}
                  onClick={() => setAudience(filter.value)}
                  className="h-10"
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {nicheFilters.map((filter) => (
              <Button
                key={filter.value}
                type="button"
                variant={niche === filter.value ? 'secondary' : 'ghost'}
                onClick={() => setNiche(filter.value)}
                className="h-9"
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/30">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1fr_320px] lg:px-6">
          <div>
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Showing {filteredPosts.length} articles</p>
                <h2 className="text-2xl font-bold text-foreground">Education that turns searches into better decisions</h2>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredPosts.map((post) => (
                <article key={post.id} className="flex min-h-[360px] flex-col rounded-lg border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <Badge variant={post.audience === 'provider' ? 'default' : 'secondary'}>
                      {post.audience === 'provider' ? 'Provider' : 'Client'}
                    </Badge>
                    <Badge variant="outline">{post.niche === 'cross-platform' ? 'Platform' : post.niche}</Badge>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Article {String(post.number).padStart(2, '0')} / {post.category}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold leading-tight text-foreground">
                    <Link to={`/blog/${post.slug}`} className="hover:text-primary">
                      {post.title}
                    </Link>
                  </h3>
                  <p className="mt-3 line-clamp-4 text-sm leading-6 text-muted-foreground">{post.deck}</p>
                  <div className="mt-auto pt-6">
                    <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                      {post.audience === 'provider' ? <Briefcase className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                      <span>{post.readTime}</span>
                    </div>
                    <Link to={`/blog/${post.slug}`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                      Read guide
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border bg-card p-5 shadow-sm">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <h2 className="mt-4 text-xl font-bold">Turn learning into action.</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Providers can build campaigns, quotes, invoices, payments, reviews, and records. Clients can find trusted
                help, compare proof, pay securely, and keep service history in one place.
              </p>
              <div className="mt-5 grid gap-3">
                <Button asChild className="w-full">
                  <Link to="/browse">Find trusted help</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/provider-dashboard">Provider dashboard</Link>
                </Button>
                <Button asChild variant="ghost" className="w-full">
                  {/* Medical mounts its learning centre (Learn.tsx) at /help.
                      /training is the Casa/Legal route and 404s here. */}
                  <Link to="/help">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Learning centre
                  </Link>
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </AppLayout>
  );
};

export default Blog;
