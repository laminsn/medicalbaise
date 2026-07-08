import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getBaiseAppKey } from '@/lib/providerCommunication';

const db = supabase as any;

export function AttributionTracker() {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const partnerCode = params.get('partner') || params.get('campaign') || params.get('partner_code');
    const referralMatch = location.pathname.match(/^\/(?:pt\/|es\/)?ref\/([^/]+)/);
    const referralCode = referralMatch?.[1] || params.get('ref') || params.get('referral');
    const appKey = getBaiseAppKey();

    if (partnerCode) {
      const cleanPartnerCode = partnerCode.trim();
      localStorage.setItem('baise_partner_code', cleanPartnerCode);
      localStorage.setItem('baise_partner_landing', `${location.pathname}${location.search}`);

      const dedupeKey = `partner:${cleanPartnerCode}:${location.pathname}`;
      if (sessionStorage.getItem('baise_last_attribution_event') !== dedupeKey) {
        sessionStorage.setItem('baise_last_attribution_event', dedupeKey);
        void db.rpc('track_partner_campaign_click', {
          target_tracking_code: cleanPartnerCode,
          target_event_type: 'click',
          event_metadata: {
            app_key: appKey,
            path: location.pathname,
            search: location.search,
            referrer: document.referrer || null,
            source: 'attribution_tracker',
          },
        });
      }
    }

    if (referralCode) {
      const cleanReferralCode = decodeURIComponent(referralCode).trim();
      localStorage.setItem('baise_referral_code', cleanReferralCode);
      localStorage.setItem('baise_referral_landing', `${location.pathname}${location.search}`);

      const dedupeKey = `referral:${cleanReferralCode}:${location.pathname}`;
      if (sessionStorage.getItem('baise_last_referral_event') !== dedupeKey) {
        sessionStorage.setItem('baise_last_referral_event', dedupeKey);
        void db.rpc('track_referral_event', {
          target_code: cleanReferralCode,
          target_event_type: 'click',
          target_app_key: appKey,
          event_metadata: {
            path: location.pathname,
            search: location.search,
            referrer: document.referrer || null,
            source: 'attribution_tracker',
          },
        });
      }
    }
  }, [location.pathname, location.search]);

  return null;
}
