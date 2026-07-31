import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { getBaiseAppKey, getBaiseAppUrl } from '@/lib/providerCommunication';
import {
  BRAND_SEO,
  LOCALE_META,
  PublicPageKey,
  SeoLocale,
  getPublicPageSeo,
  localizedPublicPath,
  normalizeSeoLocale,
  publicPageImagePath,
} from '@/lib/publicPageSeo';

type PageMetadataProps = {
  page: PublicPageKey;
  locale?: SeoLocale | string;
  path?: string;
  /**
   * The UNLOCALIZED path (e.g. '/pilot'). When supplied on an indexable page,
   * hreflang alternates are emitted for every locale plus x-default. Omit it
   * for pages whose URL is personalized or otherwise not translatable 1:1.
   */
  basePath?: string;
  title?: string;
  description?: string;
  imagePath?: string;
  imageAlt?: string;
  noIndex?: boolean;
  /** Extra JSON-LD nodes merged into the page's @graph (e.g. FAQPage). */
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
};

// Bump together with the ?v= in index.html whenever an icon file changes.
const ICON_VERSION = '20260731b';

const ALTERNATE_LOCALES: SeoLocale[] = ['en', 'pt', 'es'];
const HREFLANG: Record<SeoLocale, string> = { en: 'en', pt: 'pt-BR', es: 'es' };

const absoluteUrl = (base: string, path: string) => new URL(path, base).toString();

const syncMeta = (selector: string, attrName: 'name' | 'property', attrValue: string, content: string) => {
  const matches = Array.from(document.head.querySelectorAll<HTMLMetaElement>(selector));
  const target = matches[0] || document.createElement('meta');
  target.setAttribute(attrName, attrValue);
  target.setAttribute('content', content);
  if (!matches.length) document.head.appendChild(target);
  matches.slice(1).forEach((node) => node.setAttribute('content', content));
};

const syncLink = (selector: string, rel: string, href: string, type?: string) => {
  const matches = Array.from(document.head.querySelectorAll<HTMLLinkElement>(selector));
  const target = matches[0] || document.createElement('link');
  target.setAttribute('rel', rel);
  target.setAttribute('href', href);
  if (type) target.setAttribute('type', type);
  if (!matches.length) document.head.appendChild(target);
  matches.slice(1).forEach((node) => node.setAttribute('href', href));
};

export function PageMetadata({
  page,
  locale,
  path,
  basePath,
  title,
  description,
  imagePath,
  imageAlt,
  noIndex = false,
  structuredData,
}: PageMetadataProps) {
  const appKey = getBaiseAppKey();
  const seoLocale = normalizeSeoLocale(locale);
  const brand = BRAND_SEO[appKey];
  const meta = getPublicPageSeo(page, appKey, seoLocale);
  const localeMeta = LOCALE_META[seoLocale];
  const canonicalPath = path || (typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/');
  const pageUrl = absoluteUrl(getBaiseAppUrl(), canonicalPath);
  const shareImage = absoluteUrl(getBaiseAppUrl(), imagePath || publicPageImagePath(page, seoLocale));
  const resolvedTitle = title || meta.title;
  const resolvedDescription = description || meta.description;
  const resolvedImageAlt = imageAlt || meta.imageAlt;

  // hreflang: only for indexable pages that gave us a translatable base path.
  // x-default points at the 'en' entry, which localizedPublicPath leaves bare.
  const alternates =
    basePath && !noIndex
      ? ALTERNATE_LOCALES.map((alt) => ({
          hrefLang: HREFLANG[alt],
          href: absoluteUrl(getBaiseAppUrl(), localizedPublicPath(basePath, alt)),
        }))
      : [];

  // Site identity + this page, plus anything the page adds (e.g. FAQPage).
  // Suppressed entirely on noIndex pages — there is nothing to describe to a
  // crawler that is being told not to index.
  const organizationId = `${getBaiseAppUrl()}/#organization`;
  const extraNodes = structuredData
    ? Array.isArray(structuredData)
      ? structuredData
      : [structuredData]
    : [];
  const graph: Record<string, unknown>[] = noIndex
    ? []
    : [
        {
          '@type': 'Organization',
          '@id': organizationId,
          name: brand.name,
          url: getBaiseAppUrl(),
          logo: absoluteUrl(getBaiseAppUrl(), '/baise-logo.svg'),
          ...(brand.twitter
            ? { sameAs: [`https://twitter.com/${brand.twitter.replace('@', '')}`] }
            : {}),
        },
        {
          '@type': 'WebPage',
          '@id': `${pageUrl}#webpage`,
          url: pageUrl,
          name: resolvedTitle,
          description: resolvedDescription,
          inLanguage: localeMeta.htmlLang,
          isPartOf: { '@id': organizationId },
          primaryImageOfPage: { '@type': 'ImageObject', url: shareImage },
        },
        ...extraNodes,
      ];

  useEffect(() => {
    document.documentElement.lang = localeMeta.htmlLang;
    document.title = resolvedTitle;

    syncMeta('meta[name="description"]', 'name', 'description', resolvedDescription);
    syncMeta('meta[name="language"]', 'name', 'language', localeMeta.htmlLang);
    syncMeta('meta[property="og:title"]', 'property', 'og:title', resolvedTitle);
    syncMeta('meta[property="og:description"]', 'property', 'og:description', resolvedDescription);
    syncMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
    syncMeta('meta[property="og:url"]', 'property', 'og:url', pageUrl);
    syncMeta('meta[property="og:site_name"]', 'property', 'og:site_name', brand.name);
    syncMeta('meta[property="og:locale"]', 'property', 'og:locale', localeMeta.ogLocale);
    syncMeta('meta[property="og:image"]', 'property', 'og:image', shareImage);
    syncMeta('meta[property="og:image:secure_url"]', 'property', 'og:image:secure_url', shareImage);
    syncMeta('meta[property="og:image:type"]', 'property', 'og:image:type', 'image/png');
    syncMeta('meta[property="og:image:width"]', 'property', 'og:image:width', '1200');
    syncMeta('meta[property="og:image:height"]', 'property', 'og:image:height', '630');
    syncMeta('meta[property="og:image:alt"]', 'property', 'og:image:alt', resolvedImageAlt);
    syncMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    syncMeta('meta[name="twitter:site"]', 'name', 'twitter:site', brand.twitter);
    syncMeta('meta[name="twitter:title"]', 'name', 'twitter:title', resolvedTitle);
    syncMeta('meta[name="twitter:description"]', 'name', 'twitter:description', resolvedDescription);
    syncMeta('meta[name="twitter:image"]', 'name', 'twitter:image', shareImage);
    syncMeta('meta[name="twitter:image:alt"]', 'name', 'twitter:image:alt', resolvedImageAlt);
    syncLink('link[rel="canonical"]', 'canonical', pageUrl);
    syncLink('link[rel="icon"]', 'icon', `/favicon.svg?v=${ICON_VERSION}`, 'image/svg+xml');
    syncLink('link[rel="alternate icon"]', 'alternate icon', `/favicon.ico?v=${ICON_VERSION}`);
  }, [brand.name, brand.twitter, localeMeta.htmlLang, localeMeta.ogLocale, pageUrl, resolvedDescription, resolvedImageAlt, resolvedTitle, shareImage]);

  return (
    <Helmet>
      <html lang={localeMeta.htmlLang} />
      <title>{resolvedTitle}</title>
      <meta name="description" content={resolvedDescription} />
      <meta name="language" content={localeMeta.htmlLang} />
      {noIndex ? <meta name="robots" content="noindex, nofollow" /> : null}
      <link rel="canonical" href={pageUrl} />
      <link rel="icon" type="image/svg+xml" href={`/favicon.svg?v=${ICON_VERSION}`} />
      <link rel="alternate icon" href={`/favicon.ico?v=${ICON_VERSION}`} />

      <meta property="og:title" content={resolvedTitle} />
      <meta property="og:description" content={resolvedDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:site_name" content={brand.name} />
      <meta property="og:locale" content={localeMeta.ogLocale} />
      <meta property="og:image" content={shareImage} />
      <meta property="og:image:secure_url" content={shareImage} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={resolvedImageAlt} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={brand.twitter} />
      <meta name="twitter:title" content={resolvedTitle} />
      <meta name="twitter:description" content={resolvedDescription} />
      <meta name="twitter:image" content={shareImage} />
      <meta name="twitter:image:alt" content={resolvedImageAlt} />

      {alternates.map(({ hrefLang, href }) => (
        <link key={hrefLang} rel="alternate" hrefLang={hrefLang} href={href} />
      ))}
      {alternates.length ? (
        <link rel="alternate" hrefLang="x-default" href={alternates[0].href} />
      ) : null}

      {graph.length ? (
        <script type="application/ld+json">
          {JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}
        </script>
      ) : null}
    </Helmet>
  );
}
