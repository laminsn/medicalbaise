import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Star, ArrowLeft, MessageSquare, ThumbsUp } from 'lucide-react';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/lib/i18n-utils';

import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Review {
  id: string;
  overall_rating: number;
  quality_rating: number | null;
  punctuality_rating: number | null;
  communication_rating: number | null;
  value_rating: number | null;
  comment: string | null;
  provider_response: string | null;
  created_at: string;
  is_verified: boolean | null;
  customer_id: string;
  provider_id: string;
  job_id: string | null;
}

export default function Reviews() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received');
  const dateLocale = getDateFnsLocale(i18n);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchReviews();
  }, [user, activeTab]);

  const fetchReviews = async () => {
    if (!user) return;
    setIsLoading(true);
    
    try {
      // First check if user is a provider
      const { data: provider } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let query;
      if (activeTab === 'received' && provider) {
        query = supabase
          .from('reviews')
          .select('*')
          .eq('provider_id', provider.id)
          .order('created_at', { ascending: false });
      } else {
        query = supabase
          .from('reviews')
          .select('*')
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      setReviews(data || []);
    } catch (error) {

    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-muted text-muted'
            }`}
          />
        ))}
      </div>
    );
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, r) => sum + r.overall_rating, 0);
    return (total / reviews.length).toFixed(1);
  };

  if (!user) {
    return null;
  }

  return (
    <AppLayout>
      <div className="px-4 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t('reviews.title')}</h1>
            <p className="text-muted-foreground">{t('reviews.subtitle')}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-primary">{reviews.length}</p>
              <p className="text-xs text-muted-foreground">{t('reviews.total')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-yellow-500">{getAverageRating()}</p>
              <p className="text-xs text-muted-foreground">{t('reviews.average')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-green-600">
                {reviews.filter(r => r.overall_rating >= 4).length}
              </p>
              <p className="text-xs text-muted-foreground">{t('reviews.positive')}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="received">{t('reviews.received')}</TabsTrigger>
            <TabsTrigger value="given">{t('reviews.given')}</TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-4" />
                      <Skeleton className="h-4 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Star className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold mb-2">{t('reviews.noReviews')}</h2>
                <p className="text-muted-foreground">{t('reviews.noReviewsDescription')}</p>
              </div>
            ) : (
              reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {renderStars(review.overall_rating)}
                            {review.is_verified && (
                              <Badge variant="secondary" className="text-xs">
                                {t('reviews.verified')}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(review.created_at), 'PP', { locale: dateLocale })}
                          </span>
                        </div>

                        {review.comment && (
                          <p className="text-sm text-foreground mt-2">{review.comment}</p>
                        )}

                        {/* Rating breakdown */}
                        <div className="flex flex-wrap gap-2 mt-3 text-xs text-muted-foreground">
                          {review.quality_rating && (
                            <span className="bg-muted px-2 py-1 rounded">
                              {t('reviews.quality')}: {review.quality_rating}/5
                            </span>
                          )}
                          {review.punctuality_rating && (
                            <span className="bg-muted px-2 py-1 rounded">
                              {t('reviews.punctuality')}: {review.punctuality_rating}/5
                            </span>
                          )}
                          {review.communication_rating && (
                            <span className="bg-muted px-2 py-1 rounded">
                              {t('reviews.communication')}: {review.communication_rating}/5
                            </span>
                          )}
                          {review.value_rating && (
                            <span className="bg-muted px-2 py-1 rounded">
                              {t('reviews.value')}: {review.value_rating}/5
                            </span>
                          )}
                        </div>

                        {/* Provider response */}
                        {review.provider_response && (
                          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              {t('reviews.providerResponse')}
                            </p>
                            <p className="text-sm">{review.provider_response}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="given" className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-4" />
                      <Skeleton className="h-4 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold mb-2">{t('reviews.noGivenReviews')}</h2>
                <p className="text-muted-foreground">{t('reviews.noGivenReviewsDescription')}</p>
              </div>
            ) : (
              reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>P</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          {renderStars(review.overall_rating)}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(review.created_at), 'PP', { locale: dateLocale })}
                          </span>
                        </div>

                        {review.comment && (
                          <p className="text-sm text-foreground mt-2">{review.comment}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}