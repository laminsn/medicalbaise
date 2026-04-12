import { useState, useEffect } from 'react';
import { formatPrice } from '@/lib/currency';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, Clock, CheckCircle, XCircle, MessageCircle, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface QuoteRequest {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  budget_min: number | null;
  budget_max: number | null;
  location_address: string | null;
  urgency: string;
  responded_at: string | null;
  response_message: string | null;
  quoted_price: number | null;
  provider_id: string | null;
}

export default function MyQuotes() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchQuotes = async () => {
      try {
        const { data, error } = await supabase
          .from('quote_requests')
          .select('*')
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setQuotes(data || []);
      } catch (error) {
        console.error('Error fetching quotes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuotes();
  }, [user, navigate]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
            <Clock className="h-3 w-3 mr-1" />
            {t('quote.pending')}
          </Badge>
        );
      case 'responded':
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
            <MessageCircle className="h-3 w-3 mr-1" />
            {t('quote.responded')}
          </Badge>
        );
      case 'accepted':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            {t('quote.accepted')}
          </Badge>
        );
      case 'declined':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
            <XCircle className="h-3 w-3 mr-1" />
            {t('quote.declined')}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case 'low':
        return t('quote.urgencyLow');
      case 'normal':
        return t('quote.urgencyNormal');
      case 'high':
        return t('quote.urgencyHigh');
      case 'emergency':
        return t('quote.urgencyEmergency');
      default:
        return urgency;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <AppLayout>
      <div className="px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">{t('quote.myQuotes')}</h1>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-4 w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : quotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2">{t('quote.noQuotes')}</h2>
            <p className="text-muted-foreground mb-4">{t('quote.noQuotesDescription')}</p>
            <Button onClick={() => navigate('/browse')}>
              {t('nav.browse')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pb-24">
            {quotes.map((quote) => (
              <Card key={quote.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg line-clamp-1">{quote.title}</h3>
                    {getStatusBadge(quote.status)}
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {quote.description}
                  </p>

                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
                    {quote.budget_min && quote.budget_max && (
                      <span className="bg-muted px-2 py-1 rounded">
                        {formatPrice(quote.budget_min)} - {formatPrice(quote.budget_max)}
                      </span>
                    )}
                    <span className="bg-muted px-2 py-1 rounded">
                      {getUrgencyLabel(quote.urgency)}
                    </span>
                    {quote.location_address && (
                      <span className="bg-muted px-2 py-1 rounded line-clamp-1">
                        {quote.location_address}
                      </span>
                    )}
                  </div>

                  {quote.status === 'responded' && quote.quoted_price && (
                    <div className="bg-primary/10 rounded-lg p-3 mb-3">
                      <p className="text-sm font-medium text-primary">
                        {t('quote.responded')}: {formatPrice(quote.quoted_price)}
                      </p>
                      {quote.response_message && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {quote.response_message}
                        </p>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {format(new Date(quote.created_at), 'PPp')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}