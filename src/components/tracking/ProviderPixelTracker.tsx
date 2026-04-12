import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/** Validate tracking IDs to prevent script injection via pixel/measurement IDs */
function isValidPixelId(id: string): boolean {
  return /^\d{10,20}$/.test(id);
}
function isValidGAId(id: string): boolean {
  return /^G-[A-Z0-9]{6,12}$/.test(id);
}

interface ProviderPixelTrackerProps {
  metaPixelId?: string | null;
  googleAnalyticsId?: string | null;
  providerId: string;
}

// Declare global window types for tracking
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

// Helper to save conversion event to database
async function saveConversionEvent(
  providerId: string,
  eventType: string,
  eventName: string,
  metadata?: Record<string, unknown>
) {
  try {
    await supabase.from('conversion_events').insert([{
      provider_id: providerId,
      event_type: eventType,
      event_name: eventName,
      visitor_id: getVisitorId(),
      source: document.referrer || 'direct',
      metadata: metadata as Record<string, string> || null,
    }]);
  } catch (error) {
    // Conversion event persistence failed; tracking pixels may still fire independently
  }
}

// Generate or retrieve a visitor ID for session tracking
function getVisitorId(): string {
  const key = 'visitor_id';
  let visitorId = sessionStorage.getItem(key);
  if (!visitorId) {
    visitorId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(key, visitorId);
  }
  return visitorId;
}

export function ProviderPixelTracker({ 
  metaPixelId, 
  googleAnalyticsId,
  providerId 
}: ProviderPixelTrackerProps) {
  
  useEffect(() => {
    // Initialize Meta Pixel — only if ID passes validation
    if (metaPixelId && isValidPixelId(metaPixelId)) {
      initMetaPixel(metaPixelId);
    }

    // Initialize Google Analytics — only if ID passes validation
    if (googleAnalyticsId && isValidGAId(googleAnalyticsId)) {
      initGoogleAnalytics(googleAnalyticsId);
    }

    // Cleanup on unmount
    return () => {
      // Remove Meta Pixel script
      const metaScript = document.getElementById('meta-pixel-script');
      if (metaScript) metaScript.remove();
      const metaNoscript = document.getElementById('meta-pixel-noscript');
      if (metaNoscript) metaNoscript.remove();
      
      // Remove Google Analytics scripts
      const gaScript = document.getElementById('ga-script');
      if (gaScript) gaScript.remove();
      const gaConfigScript = document.getElementById('ga-config-script');
      if (gaConfigScript) gaConfigScript.remove();
    };
  }, [metaPixelId, googleAnalyticsId, providerId]);

  return null;
}

function initMetaPixel(pixelId: string) {
  // Check if already initialized
  if (document.getElementById('meta-pixel-script')) return;

  // Double-check validation before injecting into script context
  if (!isValidPixelId(pixelId)) return;

  // Use textContent-safe approach: encode the ID to prevent any injection
  const safePixelId = encodeURIComponent(pixelId);

  // Create and inject the Meta Pixel script
  const script = document.createElement('script');
  script.id = 'meta-pixel-script';
  script.textContent = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${safePixelId}');
    fbq('track', 'PageView');
  `;
  document.head.appendChild(script);

  // Add noscript fallback using safe DOM API
  const noscript = document.createElement('noscript');
  noscript.id = 'meta-pixel-noscript';
  const img = document.createElement('img');
  img.height = 1;
  img.width = 1;
  img.style.display = 'none';
  img.src = `https://www.facebook.com/tr?id=${safePixelId}&ev=PageView&noscript=1`;
  noscript.appendChild(img);
  document.body.appendChild(noscript);
}

function initGoogleAnalytics(measurementId: string) {
  // Check if already initialized
  if (document.getElementById('ga-script')) return;

  // Double-check validation before injecting into script context
  if (!isValidGAId(measurementId)) return;

  const safeMeasurementId = encodeURIComponent(measurementId);

  // Create gtag.js script
  const script = document.createElement('script');
  script.id = 'ga-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${safeMeasurementId}`;
  document.head.appendChild(script);

  // Initialize gtag
  const configScript = document.createElement('script');
  configScript.id = 'ga-config-script';
  configScript.textContent = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${safeMeasurementId}');
  `;
  document.head.appendChild(configScript);
}

// Conversion tracking functions - now saves to database
export const trackConversion = {
  // Track quote request initiation
  quoteRequest: (providerId: string, providerName?: string) => {
    // Save to database
    saveConversionEvent(providerId, 'lead', 'quote_request', { provider_name: providerName });

    // Meta Pixel - Lead event
    if (window.fbq) {
      window.fbq('track', 'Lead', {
        content_name: providerName || 'Provider',
        content_category: 'Quote Request',
        content_ids: [providerId],
      });
    }

    // Google Analytics - generate_lead event
    if (window.gtag) {
      window.gtag('event', 'generate_lead', {
        event_category: 'engagement',
        event_label: providerName || 'Provider',
        value: 1,
        provider_id: providerId,
      });
    }
  },

  // Track message click/initiation
  messageClick: (providerId: string, providerName?: string) => {
    // Save to database
    saveConversionEvent(providerId, 'contact', 'message_click', { provider_name: providerName });

    // Meta Pixel - Contact event
    if (window.fbq) {
      window.fbq('track', 'Contact', {
        content_name: providerName || 'Provider',
        content_category: 'Message',
        content_ids: [providerId],
      });
    }

    // Google Analytics - contact event
    if (window.gtag) {
      window.gtag('event', 'contact', {
        event_category: 'engagement',
        event_label: providerName || 'Provider',
        method: 'message',
        provider_id: providerId,
      });
    }
  },

  // Track phone call click
  phoneClick: (providerId: string, providerName?: string) => {
    // Save to database
    saveConversionEvent(providerId, 'contact', 'phone_click', { provider_name: providerName });

    // Meta Pixel - Contact event
    if (window.fbq) {
      window.fbq('track', 'Contact', {
        content_name: providerName || 'Provider',
        content_category: 'Phone Call',
        content_ids: [providerId],
      });
    }

    // Google Analytics
    if (window.gtag) {
      window.gtag('event', 'contact', {
        event_category: 'engagement',
        event_label: providerName || 'Provider',
        method: 'phone',
        provider_id: providerId,
      });
    }
  },

  // Track service booking/scheduling
  bookingInitiated: (providerId: string, serviceName?: string) => {
    // Save to database
    saveConversionEvent(providerId, 'booking', 'booking_initiated', { service_name: serviceName });

    // Meta Pixel - InitiateCheckout event
    if (window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        content_name: serviceName || 'Service',
        content_category: 'Booking',
        content_ids: [providerId],
      });
    }

    // Google Analytics - begin_checkout event
    if (window.gtag) {
      window.gtag('event', 'begin_checkout', {
        event_category: 'booking',
        event_label: serviceName || 'Service',
        provider_id: providerId,
      });
    }
  },

  // Track profile view (custom event)
  profileView: (providerId: string, providerName?: string) => {
    // Save to database
    saveConversionEvent(providerId, 'view', 'profile_view', { provider_name: providerName });

    // Meta Pixel - ViewContent event
    if (window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_name: providerName || 'Provider',
        content_category: 'Provider Profile',
        content_ids: [providerId],
        content_type: 'product',
      });
    }

    // Google Analytics - view_item event
    if (window.gtag) {
      window.gtag('event', 'view_item', {
        event_category: 'engagement',
        event_label: providerName || 'Provider',
        provider_id: providerId,
      });
    }
  },

  // Track favorite/save action
  addToFavorites: (providerId: string, providerName?: string) => {
    // Save to database
    saveConversionEvent(providerId, 'engagement', 'add_to_favorites', { provider_name: providerName });

    // Meta Pixel - AddToWishlist event
    if (window.fbq) {
      window.fbq('track', 'AddToWishlist', {
        content_name: providerName || 'Provider',
        content_ids: [providerId],
      });
    }

    // Google Analytics
    if (window.gtag) {
      window.gtag('event', 'add_to_wishlist', {
        event_category: 'engagement',
        event_label: providerName || 'Provider',
        provider_id: providerId,
      });
    }
  },
};