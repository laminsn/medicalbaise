import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, CheckCircle, CreditCard, Loader2, ShieldCheck } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  CLIENT_INVITE_WELCOME_COPY,
  type PreviewClientInvite,
  type RedeemClientInvite,
  type RedeemedInviteService,
  inviteResumePath,
  isWellFormedInviteToken,
  medicalInviteAppKey,
  persistInviteToken,
  readInviteTokenFromLocation,
} from '@/lib/clientInvite';

const db = supabase as unknown as {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }>;
};

function formatAmount(amount: number | null | undefined, currency: string) {
  if (amount == null) return 'Quoted after review';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'BRL' }).format(Number(amount));
  } catch {
    return `${amount} ${currency || 'BRL'}`;
  }
}

export default function ClientInviteWelcome() {
  const { token: pathToken = '' } = useParams();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const appKey = medicalInviteAppKey();
  const cleanToken = useMemo(
    () =>
      readInviteTokenFromLocation({
        pathToken,
        pathname: typeof window !== 'undefined' ? window.location.pathname : '',
        search: searchParams.toString(),
      }) || '',
    [pathToken, searchParams],
  );
  const validToken = isWellFormedInviteToken(cleanToken);
  const [preview, setPreview] = useState<PreviewClientInvite | null>(null);
  const [redeemed, setRedeemed] = useState<RedeemClientInvite | null>(null);
  const [busyItem, setBusyItem] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    validToken ? null : 'This invitation link is not valid.',
  );
  const [loading, setLoading] = useState(validToken);

  useEffect(() => {
    if (!validToken) {
      return;
    }
    persistInviteToken(cleanToken);

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      if (user) {
        const { data, error: rpcError } = await db.rpc('redeem_client_invite', {
          p_token: cleanToken,
          p_app_key: appKey,
        });
        if (cancelled) return;
        if (rpcError) {
          setError('We could not open this invitation.');
          setLoading(false);
          return;
        }
        const result = (data || {}) as RedeemClientInvite;
        if (!result.ok) {
          setError(
            result.error === 'EXPIRED'
              ? 'This invitation has expired.'
              : result.error === 'APP_KEY_MISMATCH' || result.error === 'APP_KEY_REJECTED'
                ? 'This invitation belongs to another Baise app.'
                : 'This invitation is no longer available.',
          );
          setLoading(false);
          return;
        }
        setRedeemed(result);
        setLoading(false);
        return;
      }

      const { data, error: rpcError } = await db.rpc('preview_client_invite', {
        p_token: cleanToken,
        p_app_key: appKey,
      });
      if (cancelled) return;
      if (rpcError) {
        setError('We could not open this invitation.');
        setLoading(false);
        return;
      }
      const result = (data || {}) as PreviewClientInvite;
      if (!result.ok) {
        setError('This invitation is no longer available.');
        setLoading(false);
        return;
      }
      setPreview(result);
      setLoading(false);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [appKey, cleanToken, user, validToken]);

  const updateItem = (itemId: string, patch: Partial<RedeemedInviteService>) => {
    setRedeemed((current) => {
      if (!current?.services) return current;
      return {
        ...current,
        services: current.services.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
      };
    });
  };

  const handleApprove = async (itemId: string, decision: 'approved' | 'declined') => {
    setBusyItem(itemId);
    const { data, error: rpcError } = await db.rpc('approve_client_invite_item', {
      p_item_id: itemId,
      p_decision: decision,
    });
    setBusyItem(null);
    const result = (data || {}) as { ok?: boolean; approval_status?: RedeemedInviteService['approval_status'] };
    if (rpcError || !result.ok) return;
    updateItem(itemId, { approval_status: result.approval_status || decision });
  };

  const handlePay = async (itemId: string) => {
    setBusyItem(itemId);
    const { data, error: rpcError } = await db.rpc('request_client_invite_payment', {
      p_item_id: itemId,
    });
    setBusyItem(null);
    const result = (data || {}) as { ok?: boolean; payment_status?: RedeemedInviteService['payment_status'] };
    if (rpcError || !result.ok) return;
    updateItem(itemId, { payment_status: result.payment_status || 'pending' });
  };

  const providerName = redeemed?.provider_name || preview?.provider_name || 'Your provider';
  const services = redeemed?.services || preview?.services || [];

  return (
    <AppLayout>
      <Helmet>
        <title>Client invitation | MD Baise</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="container mx-auto max-w-3xl px-4 py-8 space-y-6">
        <div className="space-y-2">
          <Badge variant="secondary">MD Baise invitation</Badge>
          <h1 className="text-3xl font-semibold tracking-tight">Welcome to MD Baise</h1>
          <p className="text-muted-foreground">{CLIENT_INVITE_WELCOME_COPY}</p>
        </div>

        {authLoading || loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card>
            <CardHeader>
              <CardTitle>Invitation unavailable</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/">Go to MD Baise</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{providerName}</CardTitle>
                <CardDescription>
                  {user
                    ? 'Review proposed services, approve what you want, then pay and track status.'
                    : 'Create your patient account to view proposed services, approve, pay, and follow status.'}
                </CardDescription>
              </CardHeader>
              {!user && (
                <CardContent className="flex flex-col gap-3 sm:flex-row">
                  <Button asChild>
                    <Link to={`/auth?invite=${encodeURIComponent(cleanToken)}`}>
                      Register
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to={`/auth?invite=${encodeURIComponent(cleanToken)}`}>Sign in</Link>
                  </Button>
                </CardContent>
              )}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Proposed services</CardTitle>
                <CardDescription>Only services from this invitation are shown.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {services.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No services were attached. You can still join the MD Baise community.</p>
                ) : (
                  services.map((service, index) => {
                    const item = service as Partial<RedeemedInviteService> & { title: string; amount?: number | null; currency?: string };
                    const itemId = 'id' in item ? item.id : null;
                    return (
                      <div key={itemId || `${item.title}-${index}`} className="rounded-lg border p-4 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-sm text-muted-foreground">{formatAmount(item.amount ?? null, item.currency || 'BRL')}</p>
                          </div>
                          {item.approval_status && (
                            <Badge variant="outline">{item.approval_status}</Badge>
                          )}
                        </div>
                        {user && itemId && (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant={item.approval_status === 'approved' ? 'default' : 'outline'}
                              disabled={busyItem === itemId}
                              onClick={() => handleApprove(itemId, 'approved')}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busyItem === itemId}
                              onClick={() => handleApprove(itemId, 'declined')}
                            >
                              Decline
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={busyItem === itemId || item.approval_status !== 'approved' || item.payment_status === 'paid'}
                              onClick={() => handlePay(itemId)}
                            >
                              <CreditCard className="mr-2 h-4 w-4" />
                              {item.payment_status === 'pending' ? 'Payment requested' : item.payment_status === 'paid' ? 'Paid' : 'Pay'}
                            </Button>
                          </div>
                        )}
                        {user && item.payment_status && (
                          <p className="text-xs text-muted-foreground">Payment status: {item.payment_status}</p>
                        )}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {user && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    Status
                  </CardTitle>
                  <CardDescription>This invitation is bound to your patient account. Payment status is read-only for you.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline">
                    <Link to={inviteResumePath(cleanToken)}>Refresh status</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
