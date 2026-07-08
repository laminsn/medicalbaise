import { useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PlusCircle, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { getBaiseAppKey } from '@/lib/providerCommunication';
import { useAuth } from '@/hooks/useAuth';

const db = supabase as any;

type ProductRelation = {
  name: string | null;
  audience: string | null;
};

type Recommendation = {
  id: string;
  recommended_product_key: string;
  recommendation_title: string;
  value_message: string;
  relation_type: string;
  priority: number;
  platform_products?: ProductRelation | ProductRelation[] | null;
};

type Journey = {
  product_key: string;
  client_addon_label: string | null;
  client_addon_description: string | null;
  portal_cta_label: string | null;
};

function getOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] || null : value;
}

function fallbackLabel(productKey: string, title: string) {
  const key = productKey.toLowerCase();
  if (key.includes('annual')) return 'Request annual care';
  if (key.includes('insurance')) return 'Ask about title insurance';
  if (key.includes('residency')) return 'Explore residency support';
  if (key.includes('ownership')) return 'Review ownership structure';
  if (key.includes('vault') || key.includes('records')) return 'Organize my records';
  return title;
}

function appTitle(appKey: string) {
  if (appKey === 'legal') return 'Helpful legal add-ons';
  if (appKey === 'medical') return 'Helpful care add-ons';
  return 'Helpful service add-ons';
}

export function ClientProductAddOns() {
  const appKey = getBaiseAppKey();
  const { user } = useAuth();

  const addOnsQuery = useQuery({
    queryKey: ['client-product-addons', appKey, user?.id],
    enabled: Boolean(user?.id),
    retry: false,
    queryFn: async () => {
      const { data: recommendations, error: recommendationError } = await db
        .from('product_recommendations')
        .select(`
          id,
          recommended_product_key,
          recommendation_title,
          value_message,
          relation_type,
          priority,
          platform_products ( name, audience )
        `)
        .eq('app_key', appKey)
        .eq('user_id', user!.id)
        .in('status', ['pending', 'queued', 'sent', 'viewed'])
        .order('priority', { ascending: false })
        .limit(6);

      if (recommendationError) throw recommendationError;

      const productKeys = (recommendations || []).map((item: Recommendation) => item.recommended_product_key);
      if (productKeys.length === 0) return { recommendations: [] as Recommendation[], journeys: [] as Journey[] };

      const { data: journeys, error: journeyError } = await db
        .from('product_offer_journeys')
        .select('product_key, client_addon_label, client_addon_description, portal_cta_label')
        .eq('app_key', appKey)
        .eq('status', 'active')
        .in('product_key', productKeys);

      if (journeyError) throw journeyError;

      return {
        recommendations: (recommendations || []) as Recommendation[],
        journeys: (journeys || []) as Journey[],
      };
    },
  });

  const requestMutation = useMutation({
    mutationFn: async ({ productKey, message }: { productKey: string; message: string }) => {
      const { error } = await db.rpc('submit_client_product_addon_request', {
        target_app_key: appKey,
        target_product_key: productKey,
        target_message: message,
        target_source: 'client_dashboard',
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success('Request sent'),
    onError: (error: Error) => toast.error(error.message || 'Unable to send request'),
  });

  const addOns = useMemo(() => {
    const journeyByProduct = new Map((addOnsQuery.data?.journeys || []).map((journey) => [journey.product_key, journey]));

    return (addOnsQuery.data?.recommendations || [])
      .filter((recommendation) => {
        const product = getOne(recommendation.platform_products);
        return !product?.audience || ['all', 'client'].includes(product.audience);
      })
      .slice(0, 3)
      .map((recommendation) => {
        const journey = journeyByProduct.get(recommendation.recommended_product_key);
        return {
          ...recommendation,
          label: journey?.client_addon_label || fallbackLabel(recommendation.recommended_product_key, recommendation.recommendation_title),
          description: journey?.client_addon_description || recommendation.value_message,
          cta: journey?.portal_cta_label || 'Ask about this',
        };
      });
  }, [addOnsQuery.data]);

  if (!user || addOnsQuery.isError || addOns.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {appTitle(appKey)}
        </CardTitle>
        <CardDescription>
          Optional next steps that may make your current services easier to organize, protect, or continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-3">
          {addOns.map((addOn) => (
            <div key={addOn.id} className="flex min-h-44 flex-col justify-between rounded-md border p-4">
              <div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary">{addOn.relation_type.replace(/_/g, ' ')}</Badge>
                </div>
                <p className="mt-3 font-medium">{addOn.label}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{addOn.description}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="mt-4 gap-2"
                disabled={requestMutation.isPending}
                onClick={() => requestMutation.mutate({ productKey: addOn.recommended_product_key, message: addOn.description })}
              >
                <PlusCircle className="h-4 w-4" />
                {addOn.cta}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
