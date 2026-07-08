import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { getBaiseAppKey, getBaiseAppUrl } from '@/lib/providerCommunication';
import {
  BRAND_SEO,
  LOCALE_META,
  PublicPageKey,
  SeoLocale,
  getPublicPageSeo,
  normalizeSeoLocale,
  publicPageImagePath,
} from '@/lib/publicPageSeo';

type PageMetadataProps = {
  page: PublicPageKey;
  locale?: SeoLocale | string;
  path?: string;
  title?: string;
  description?: string;
  imagePath?: string;
  imageAlt?: string;
  noIndex?: boolean;
};

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
  title,
  description,
  imagePath,
  imageAlt,
  noIndex = false,
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
    syncLink('link[rel="icon"]', 'icon', '/favicon.svg', 'image/svg+xml');
    syncLink('link[rel="alternate icon"]', 'alternate icon', '/favicon.ico');
  }, [brand.name, brand.twitter, localeMeta.htmlLang, localeMeta.ogLocale, pageUrl, resolvedDescription, resolvedImageAlt, resolvedTitle, shareImage]);

  return (
    <Helmet>
      <html lang={localeMeta.htmlLang} />
      <title>{resolvedTitle}</title>
      <meta name="description" content={resolvedDescription} />
      <meta name="language" content={localeMeta.htmlLang} />
      {noIndex ? <meta name="robots" content="noindex, nofollow" /> : null}
      <link rel="canonical" href={pageUrl} />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="alternate icon" href="/favicon.ico" />

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
    </Helmet>
  );
}
