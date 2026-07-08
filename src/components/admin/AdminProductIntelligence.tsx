import { type ReactNode, type SetStateAction, type Dispatch, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  BadgeDollarSign,
  CheckCircle2,
  Gift,
  Loader2,
  PackagePlus,
  RefreshCcw,
  Send,
  Sparkles,
  Tag,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { getBaiseAppKey } from '@/lib/providerCommunication';
import { AdminProductRevenueAutomation } from '@/components/admin/AdminProductRevenueAutomation';

const db = supabase as any;

type ProductSummary = {
  metric_key: string;
  metric_label: string;
  metric_value: number;
  detail: string | null;
};

type Product = {
  id: string;
  app_key: string;
  product_key: string;
  name: string;
  short_name: string | null;
  description: string | null;
  product_family: string;
  audience: string;
  tier_level: string;
  price_amount: number;
  currency: string;
  billing_interval: string;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  value_points: string[] | null;
  tags: string[] | null;
  created_at: string;
};

type RecommendationPerson = {
  full_name: string | null;
  email: string | null;
  person_type: string | null;
};

type RecommendationProduct = {
  name: string | null;
  audience: string | null;
  product_family: string | null;
};

type Recommendation = {
  id: string;
  person_id: string | null;
  recommended_product_key: string;
  relation_type: string;
  priority: number;
  status: string;
  recommendation_title: string;
  value_message: string;
  trigger_reason: string | null;
  next_step: string;
  last_sent_at: string | null;
  expires_at: string | null;
  created_at: string;
  growth_people?: RecommendationPerson | RecommendationPerson[] | null;
  platform_products?: RecommendationProduct | RecommendationProduct[] | null;
};

type OfferRule = {
  id: string;
  rule_key: string;
  name: string;
  audience: string;
  source_product_key: string | null;
  recommended_product_key: string;
  relation_type: string;
  trigger_event: string;
  priority: number;
  status: string;
  recommendation_title: string;
  value_message: string;
};

type ProviderOption = {
  id: string;
  business_name: string | null;
};

const productFamilies = ['core', 'premium', 'provider_growth', 'payments', 'operations', 'marketing', 'verification', 'partner', 'legal', 'medical', 'custom'];
const audiences = ['all', 'client', 'provider', 'partner', 'staff'];
const tiers = ['free', 'entry', 'growth', 'premium', 'advanced', 'enterprise'];
const billingIntervals = ['one_time', 'monthly', 'annual', 'usage', 'custom'];

function humanize(value?: string | null) {
  if (!value) return 'Not set';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatAmount(amount = 0, currency = 'BRL', interval = 'monthly') {
  if (!amount) return humanize(interval);
  try {
    return `${new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: amount >= 100 ? 0 : 2,
    }).format(amount)} / ${humanize(interval).toLowerCase()}`;
  } catch {
    return `${currency} ${amount.toFixed(2)} / ${humanize(interval).toLowerCase()}`;
  }
}

function getRelationship<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] || null : value;
}

function makeProductKey(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 56);
}

export function AdminProductIntelligence() {
  const appKey = getBaiseAppKey();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [actionRecommendation, setActionRecommendation] = useState<Recommendation | null>(null);
  const [form, setForm] = useState({
    name: '',
    product_key: '',
    description: '',
    product_family: appKey === 'legal' ? 'legal' : appKey === 'medical' ? 'medical' : 'premium',
    audience: 'client',
    tier_level: 'entry',
    price_amount: '',
    billing_interval: 'monthly',
    value_points: '',
    tags: '',
    is_featured: false,
  });

  const summaryQuery = useQuery({
    queryKey: ['product-intelligence-summary', appKey],
    queryFn: async () => {
      const { data, error } = await db.rpc('get_product_intelligence_summary', { target_app_key: appKey });
      if (error) throw error;
      return (data || []) as ProductSummary[];
    },
  });

  const productsQuery = useQuery({
    queryKey: ['platform-products', appKey],
    queryFn: async () => {
      const { data, error } = await db
        .from('platform_products')
        .select('id, app_key, product_key, name, short_name, description, product_family, audience, tier_level, price_amount, currency, billing_interval, is_active, is_featured, display_order, value_points, tags, created_at')
        .eq('app_key', appKey)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return (data || []) as Product[];
    },
  });

  const recommendationsQuery = useQuery({
    queryKey: ['product-recommendations', appKey],
    queryFn: async () => {
      const { data, error } = await db
        .from('product_recommendations')
        .select(`
          id,
          person_id,
          recommended_product_key,
          relation_type,
          priority,
          status,
          recommendation_title,
          value_message,
          trigger_reason,
          next_step,
          last_sent_at,
          expires_at,
          created_at,
          growth_people ( full_name, email, person_type ),
          platform_products ( name, audience, product_family )
        `)
        .eq('app_key', appKey)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(60);

      if (error) throw error;
      return (data || []) as Recommendation[];
    },
  });

  const rulesQuery = useQuery({
    queryKey: ['product-offer-rules', appKey],
    queryFn: async () => {
      const { data, error } = await db
        .from('product_offer_rules')
        .select('id, rule_key, name, audience, source_product_key, recommended_product_key, relation_type, trigger_event, priority, status, recommendation_title, value_message')
        .eq('app_key', appKey)
        .order('priority', { ascending: false });

      if (error) throw error;
      return (data || []) as OfferRule[];
    },
  });

  const providersQuery = useQuery({
    queryKey: ['product-revenue-provider-options', appKey],
    queryFn: async () => {
      const { data, error } = await db
        .from('providers')
        .select('id, business_name')
        .order('business_name')
        .limit(120);
      if (error) throw error;
      return (data || []) as ProviderOption[];
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await db.rpc('sync_product_recommendations_for_app', { target_app_key: appKey });
      if (error) throw error;
      return Array.isArray(data) ? data[0] : data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['product-intelligence-summary', appKey] });
      queryClient.invalidateQueries({ queryKey: ['product-recommendations', appKey] });
      toast.success(`Product recommendations synced${result?.recommendations_generated ? `: ${result.recommendations_generated} new` : ''}`);
    },
    onError: (error: Error) => toast.error(error.message || 'Unable to sync product recommendations'),
  });

  const createProductMutation = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error('Product name is required');
      const productKey = form.product_key.trim() || makeProductKey(form.name);
      if (!productKey) throw new Error('Product key is required');

      const { error } = await db.from('platform_products').insert({
        app_key: appKey,
        product_key: productKey,
        name: form.name.trim(),
        short_name: form.name.trim(),
        description: form.description.trim() || null,
        product_family: form.product_family,
        audience: form.audience,
        tier_level: form.tier_level,
        price_amount: Number(form.price_amount) || 0,
        currency: 'BRL',
        billing_interval: form.billing_interval,
        is_active: true,
        is_featured: form.is_featured,
        value_points: form.value_points
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
        tags: form.tags
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        metadata: { source: 'admin_product_intelligence' },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-products', appKey] });
      queryClient.invalidateQueries({ queryKey: ['product-intelligence-summary', appKey] });
      setCreateDialogOpen(false);
      resetForm();
      toast.success('Product added');
    },
    onError: (error: Error) => toast.error(error.message || 'Unable to add product'),
  });

  const toggleProductMutation = useMutation({
    mutationFn: async ({ productId, isActive }: { productId: string; isActive: boolean }) => {
      const { error } = await db
        .from('platform_products')
        .update({ is_active: isActive })
        .eq('id', productId)
        .eq('app_key', appKey);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-products', appKey] });
      queryClient.invalidateQueries({ queryKey: ['product-intelligence-summary', appKey] });
    },
    onError: (error: Error) => toast.error(error.message || 'Unable to update product'),
  });

  const updateRecommendationMutation = useMutation({
    mutationFn: async ({ recommendation, status, channel }: { recommendation: Recommendation; status: string; channel: string }) => {
      const { error } = await db.rpc('mark_product_recommendation_status', {
        target_recommendation_id: recommendation.id,
        next_status: status,
        event_channel: channel,
        event_metadata: {
          source: 'admin_product_intelligence',
          title: recommendation.recommendation_title,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-recommendations', appKey] });
      queryClient.invalidateQueries({ queryKey: ['product-intelligence-summary', appKey] });
      toast.success('Recommendation updated');
    },
    onError: (error: Error) => toast.error(error.message || 'Unable to update recommendation'),
  });

  const registerProductMutation = useMutation({
    mutationFn: async (recommendation: Recommendation) => {
      if (!recommendation.person_id) throw new Error('Recommendation is missing a relationship profile');
      const { error } = await db.rpc('register_person_product', {
        target_person_id: recommendation.person_id,
        target_product_key: recommendation.recommended_product_key,
        target_status: 'requested',
        target_source: 'staff_recommendation',
        target_metadata: {
          recommendation_id: recommendation.id,
          value_message: recommendation.value_message,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-recommendations', appKey] });
      queryClient.invalidateQueries({ queryKey: ['product-intelligence-summary', appKey] });
      toast.success('Product request registered');
    },
    onError: (error: Error) => toast.error(error.message || 'Unable to register product request'),
  });

  const revenueActionMutation = useMutation({
    mutationFn: async ({
      recommendation,
      actionType,
      providerId,
      amount,
      metadata,
    }: {
      recommendation: Recommendation;
      actionType: string;
      providerId: string | null;
      amount: number;
      metadata: Record<string, unknown>;
    }) => {
      const { error } = await db.rpc('create_product_revenue_action', {
        target_recommendation_id: recommendation.id,
        target_action_type: actionType,
        target_provider_id: providerId,
        target_amount: amount,
        target_metadata: metadata,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-recommendations', appKey] });
      queryClient.invalidateQueries({ queryKey: ['product-intelligence-summary', appKey] });
      queryClient.invalidateQueries({ queryKey: ['product-revenue-actions', appKey] });
      queryClient.invalidateQueries({ queryKey: ['product-revenue-metrics', appKey] });
      queryClient.invalidateQueries({ queryKey: ['product-revenue-attribution', appKey] });
      queryClient.invalidateQueries({ queryKey: ['product-fit-scores', appKey] });
      setActionRecommendation(null);
      toast.success('Revenue action created');
    },
    onError: (error: Error) => toast.error(error.message || 'Unable to create revenue action'),
  });

  const recommendations = recommendationsQuery.data || [];
  const products = productsQuery.data || [];
  const rules = rulesQuery.data || [];
  const openRecommendations = recommendations.filter((item) => ['pending', 'queued', 'sent', 'viewed'].includes(item.status));

  const groupedProducts = useMemo(() => {
    return products.reduce<Record<string, Product[]>>((acc, product) => {
      acc[product.audience] = acc[product.audience] || [];
      acc[product.audience].push(product);
      return acc;
    }, {});
  }, [products]);

  const resetForm = () => {
    setForm({
      name: '',
      product_key: '',
      description: '',
      product_family: appKey === 'legal' ? 'legal' : appKey === 'medical' ? 'medical' : 'premium',
      audience: 'client',
      tier_level: 'entry',
      price_amount: '',
      billing_interval: 'monthly',
      value_points: '',
      tags: '',
      is_featured: false,
    });
  };

  if (summaryQuery.isLoading || productsQuery.isLoading) {
    return (
      <Card>
        <CardContent className="flex min-h-52 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (summaryQuery.error || productsQuery.error) {
    const error = summaryQuery.error || productsQuery.error;
    return (
      <Card className="border-amber-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-600" />
            Product intelligence needs activation
          </CardTitle>
          <CardDescription>Apply the product intelligence migration after Growth Hub and Relationship OS are active.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
            {error instanceof Error ? error.message : 'Product intelligence is not available yet.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BadgeDollarSign className="h-5 w-5 text-primary" />
                Product Intelligence
              </CardTitle>
              <CardDescription>
                Manage the offer catalog and value-focused upsell, downsell, cross-sell, welcome, and retargeting queue.
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" className="gap-2" disabled={syncMutation.isPending} onClick={() => syncMutation.mutate()}>
                {syncMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                Sync Recommendations
              </Button>
              <Button type="button" className="gap-2" onClick={() => setCreateDialogOpen(true)}>
                <PackagePlus className="h-4 w-4" />
                Add Product
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {(summaryQuery.data || []).map((metric) => (
              <MetricCard key={metric.metric_key} metric={metric} />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Tag className="h-4 w-4 text-primary" />
              Product Catalog
            </CardTitle>
            <CardDescription>Add or subtract products from the system without changing campaign pages.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[620px] pr-3">
              <div className="space-y-4">
                {Object.entries(groupedProducts).map(([audience, audienceProducts]) => (
                  <div key={audience} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{humanize(audience)}</Badge>
                      <p className="text-xs text-muted-foreground">{audienceProducts.length} product{audienceProducts.length === 1 ? '' : 's'}</p>
                    </div>
                    {audienceProducts.map((product) => (
                      <Card key={product.id} className={!product.is_active ? 'opacity-60' : ''}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium">{product.name}</p>
                              <p className="mt-1 text-xs text-muted-foreground">{product.description || product.product_key}</p>
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                <Badge variant="outline" className="text-[10px]">{humanize(product.product_family)}</Badge>
                                <Badge variant="outline" className="text-[10px]">{humanize(product.tier_level)}</Badge>
                                <Badge variant="secondary" className="text-[10px]">
                                  {formatAmount(product.price_amount, product.currency, product.billing_interval)}
                                </Badge>
                              </div>
                            </div>
                            <Switch
                              checked={product.is_active}
                              onCheckedChange={(checked) => toggleProductMutation.mutate({ productId: product.id, isActive: checked })}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              Value Recommendations
            </CardTitle>
            <CardDescription>
              Retargeting, upsell, and downsell recommendations based on what each person has not registered for yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recommendationsQuery.isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : openRecommendations.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No open product recommendations yet. Sync recommendations after Growth Hub has relationship profiles.</p>
            ) : (
              <ScrollArea className="h-[620px] pr-3">
                <div className="space-y-3">
                  {openRecommendations.map((recommendation) => (
                    <RecommendationCard
                      key={recommendation.id}
                      recommendation={recommendation}
                      onQueue={() => updateRecommendationMutation.mutate({ recommendation, status: 'queued', channel: 'staff' })}
                      onSent={() => updateRecommendationMutation.mutate({ recommendation, status: 'sent', channel: 'email' })}
                      onRegister={() => registerProductMutation.mutate(recommendation)}
                      onDismiss={() => updateRecommendationMutation.mutate({ recommendation, status: 'dismissed', channel: 'staff' })}
                      onRevenueAction={() => setActionRecommendation(recommendation)}
                      busy={updateRecommendationMutation.isPending || registerProductMutation.isPending}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      <AdminProductRevenueAutomation />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="h-4 w-4 text-primary" />
            Offer Rules
          </CardTitle>
          <CardDescription>Seeded upsell, downsell, welcome, congrats, cross-sell, and retargeting logic.</CardDescription>
        </CardHeader>
        <CardContent>
          {rulesQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {rules.slice(0, 10).map((rule) => (
                <div key={rule.id} className="rounded-md border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{rule.name}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{rule.value_message}</p>
                    </div>
                    <Badge variant="outline">{humanize(rule.relation_type)}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary">{humanize(rule.audience)}</Badge>
                    <Badge variant="outline">{rule.source_product_key || 'Any start'} → {rule.recommended_product_key}</Badge>
                    <Badge variant="outline">Priority {rule.priority}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateProductDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        form={form}
        setForm={setForm}
        onSubmit={() => createProductMutation.mutate()}
        isPending={createProductMutation.isPending}
      />

      <RevenueActionDialog
        key={actionRecommendation?.id || 'closed'}
        recommendation={actionRecommendation}
        providers={providersQuery.data || []}
        open={Boolean(actionRecommendation)}
        onOpenChange={(open) => !open && setActionRecommendation(null)}
        isPending={revenueActionMutation.isPending}
        onSubmit={(payload) => {
          if (!actionRecommendation) return;
          revenueActionMutation.mutate({ recommendation: actionRecommendation, ...payload });
        }}
      />
    </div>
  );
}

function MetricCard({ metric }: { metric: ProductSummary }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{metric.metric_label}</p>
        <p className="mt-1 text-2xl font-bold">{Number(metric.metric_value || 0).toLocaleString()}</p>
        {metric.detail ? <p className="mt-3 text-xs leading-5 text-muted-foreground">{metric.detail}</p> : null}
      </CardContent>
    </Card>
  );
}

function RecommendationCard({
  recommendation,
  onQueue,
  onSent,
  onRegister,
  onDismiss,
  onRevenueAction,
  busy,
}: {
  recommendation: Recommendation;
  onQueue: () => void;
  onSent: () => void;
  onRegister: () => void;
  onDismiss: () => void;
  onRevenueAction: () => void;
  busy: boolean;
}) {
  const person = getRelationship(recommendation.growth_people);
  const product = getRelationship(recommendation.platform_products);
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-medium">{recommendation.recommendation_title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {[person?.full_name || person?.email || 'Unknown relationship', product?.name || recommendation.recommended_product_key]
                .filter(Boolean)
                .join(' - ')}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline">{humanize(recommendation.relation_type)}</Badge>
            <Badge variant="secondary">Priority {recommendation.priority}</Badge>
          </div>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{recommendation.value_message}</p>
        {recommendation.trigger_reason ? (
          <p className="rounded-md bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
            <span className="font-medium text-foreground">Why now:</span> {recommendation.trigger_reason}
          </p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" size="sm" variant="outline" className="gap-2" disabled={busy} onClick={onQueue}>
            <Sparkles className="h-4 w-4" />
            Queue
          </Button>
          <Button type="button" size="sm" variant="outline" className="gap-2" disabled={busy} onClick={onSent}>
            <Send className="h-4 w-4" />
            Mark Sent
          </Button>
          <Button type="button" size="sm" className="gap-2" disabled={busy} onClick={onRegister}>
            <CheckCircle2 className="h-4 w-4" />
            Register Request
          </Button>
          <Button type="button" size="sm" variant="outline" className="gap-2" disabled={busy} onClick={onRevenueAction}>
            <BadgeDollarSign className="h-4 w-4" />
            Revenue Action
          </Button>
          <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RevenueActionDialog({
  recommendation,
  providers,
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  recommendation: Recommendation | null;
  providers: ProviderOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { actionType: string; providerId: string | null; amount: number; metadata: Record<string, unknown> }) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState({
    action_type: 'proposal_draft',
    provider_id: 'none',
    amount: '',
    scheduled_for: '',
    subject: '',
    message_body: '',
    internal_notes: '',
  });

  const submit = () => {
    onSubmit({
      actionType: form.action_type,
      providerId: form.provider_id === 'none' ? null : form.provider_id,
      amount: Number(form.amount) || 0,
      metadata: {
        scheduled_for: form.scheduled_for || null,
        subject: form.subject || recommendation?.recommendation_title,
        message_body: form.message_body || recommendation?.value_message,
        internal_notes: form.internal_notes || null,
        client_safe_message: recommendation?.value_message,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create revenue action</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-md bg-muted/60 p-3 text-sm leading-6 text-muted-foreground">
            <span className="font-medium text-foreground">{recommendation?.recommendation_title || 'Recommendation'}</span>
            <br />
            {recommendation?.value_message || 'Create the next clean action from this recommendation.'}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Action">
              <Select value={form.action_type} onValueChange={(value) => setForm((current) => ({ ...current, action_type: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="proposal_draft">Create proposal draft</SelectItem>
                  <SelectItem value="quote_line">Create invoice / quote line</SelectItem>
                  <SelectItem value="call_scheduled">Schedule consultation</SelectItem>
                  <SelectItem value="value_email">Send value email</SelectItem>
                  <SelectItem value="not_now">Mark not now</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Provider">
              <Select value={form.provider_id} onValueChange={(value) => setForm((current) => ({ ...current, provider_id: value }))}>
                <SelectTrigger><SelectValue placeholder="Queue only" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Queue only</SelectItem>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.business_name || provider.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Amount">
              <Input
                type="number"
                min="0"
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                placeholder="0"
              />
            </Field>
            <Field label="Scheduled time">
              <Input
                type="datetime-local"
                value={form.scheduled_for}
                onChange={(event) => setForm((current) => ({ ...current, scheduled_for: event.target.value }))}
              />
            </Field>
            <Field label="Subject">
              <Input
                value={form.subject}
                onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                placeholder={recommendation?.recommendation_title || 'Value recommendation'}
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Message">
                <Textarea
                  rows={4}
                  value={form.message_body}
                  onChange={(event) => setForm((current) => ({ ...current, message_body: event.target.value }))}
                  placeholder={recommendation?.value_message || 'Client-safe value message'}
                />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Internal notes">
                <Textarea
                  rows={3}
                  value={form.internal_notes}
                  onChange={(event) => setForm((current) => ({ ...current, internal_notes: event.target.value }))}
                  placeholder="Staff-only context, timing, or next step."
                />
              </Field>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" disabled={isPending} onClick={submit}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BadgeDollarSign className="mr-2 h-4 w-4" />}
            Create Action
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateProductDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: Record<string, any>;
  setForm: Dispatch<SetStateAction<any>>;
  onSubmit: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add product</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Product name">
            <Input
              value={form.name}
              onChange={(event) => setForm((current: any) => ({
                ...current,
                name: event.target.value,
                product_key: current.product_key || makeProductKey(event.target.value),
              }))}
              placeholder="Premium access"
            />
          </Field>
          <Field label="Product key">
            <Input
              value={form.product_key}
              onChange={(event) => setForm((current: any) => ({ ...current, product_key: makeProductKey(event.target.value) }))}
              placeholder="premium_access"
            />
          </Field>
          <Field label="Audience">
            <Select value={form.audience} onValueChange={(value) => setForm((current: any) => ({ ...current, audience: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{audiences.map((item) => <SelectItem key={item} value={item}>{humanize(item)}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Family">
            <Select value={form.product_family} onValueChange={(value) => setForm((current: any) => ({ ...current, product_family: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{productFamilies.map((item) => <SelectItem key={item} value={item}>{humanize(item)}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Tier">
            <Select value={form.tier_level} onValueChange={(value) => setForm((current: any) => ({ ...current, tier_level: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{tiers.map((item) => <SelectItem key={item} value={item}>{humanize(item)}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Billing">
            <Select value={form.billing_interval} onValueChange={(value) => setForm((current: any) => ({ ...current, billing_interval: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{billingIntervals.map((item) => <SelectItem key={item} value={item}>{humanize(item)}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Price amount">
            <Input
              type="number"
              min="0"
              value={form.price_amount}
              onChange={(event) => setForm((current: any) => ({ ...current, price_amount: event.target.value }))}
              placeholder="0"
            />
          </Field>
          <Field label="Tags">
            <Input
              value={form.tags}
              onChange={(event) => setForm((current: any) => ({ ...current, tags: event.target.value }))}
              placeholder="client, premium, records"
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Description">
              <Textarea
                value={form.description}
                onChange={(event) => setForm((current: any) => ({ ...current, description: event.target.value }))}
                rows={3}
                placeholder="Describe the value this product creates."
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Value points">
              <Textarea
                value={form.value_points}
                onChange={(event) => setForm((current: any) => ({ ...current, value_points: event.target.value }))}
                rows={4}
                placeholder={'One value point per line\nKeeps records organized\nReduces admin time'}
              />
            </Field>
          </div>
          <div className="flex items-center justify-between rounded-md border p-3 md:col-span-2">
            <Label>Featured product</Label>
            <Switch
              checked={form.is_featured}
              onCheckedChange={(checked) => setForm((current: any) => ({ ...current, is_featured: checked }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" disabled={isPending} onClick={onSubmit}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackagePlus className="mr-2 h-4 w-4" />}
            Add Product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
