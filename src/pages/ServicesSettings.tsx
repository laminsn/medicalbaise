import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, Plus, Trash2, Loader2, Package, DollarSign, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

interface ServiceCategory {
  id: string;
  name_en: string;
  name_pt: string;
}

interface ProviderService {
  id: string;
  category_id: string;
  description: string | null;
  hourly_rate: number | null;
  fixed_price: number | null;
  is_quote_based: boolean | null;
  category?: ServiceCategory;
}

const MAX_SERVICES = 20;

export default function ServicesSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  const [isLoading, setIsLoading] = useState(true);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [services, setServices] = useState<ProviderService[]>([]);

  const canAddMore = services.length < MAX_SERVICES;

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      navigate('/auth');
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch provider info
      const { data: providerData } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!providerData) {
        toast.error(t('services.providerRequired', 'You need to be a provider to access this page'));
        navigate('/profile');
        return;
      }

      setProviderId(providerData.id);

      // Fetch existing services
      const { data: servicesData } = await supabase
        .from('provider_services')
        .select(`
          id,
          category_id,
          description,
          hourly_rate,
          fixed_price,
          is_quote_based,
          category:service_categories(id, name_en, name_pt)
        `)
        .eq('provider_id', providerData.id);

      setServices(servicesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddService = () => {
    if (!canAddMore) {
      toast.error(t('services.limitReached', 'Maximum of 20 services allowed.'));
      return;
    }
    navigate('/services/new');
  };

  const handleEditService = (service: ProviderService) => {
    navigate(`/services/${service.id}`);
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from('provider_services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;
      
      setServices(prev => prev.filter(s => s.id !== serviceId));
      toast.success(t('services.serviceDeleted', 'Service deleted'));
    } catch (error: any) {
      console.error('Error deleting service:', error);
      toast.error(error.message || t('common.error'));
    }
  };

  const getCategoryName = (category: ServiceCategory | undefined) => {
    if (!category) return '';
    return i18n.language === 'pt' ? category.name_pt : category.name_en;
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('services.title', 'My Services')} - Brasil Base</title>
      </Helmet>
      <AppLayout>
        <div className="px-4 py-6 pb-24 max-w-lg mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{t('services.title', 'My Services')}</h1>
              <p className="text-sm text-muted-foreground">
                {t('services.subtitle', 'Manage your service offerings')}
              </p>
            </div>
          </div>

          {/* Service Count Info */}
          <Card className="mb-6">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">
                      {t('services.servicesCount', 'Services: {{used}}/{{limit}}', {
                        used: services.length,
                        limit: MAX_SERVICES,
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('services.addUpTo', 'Add up to 20 services')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services List */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">{t('services.yourServices', 'Your Services')}</h2>
              <Button size="sm" onClick={handleAddService} disabled={!canAddMore}>
                <Plus className="h-4 w-4 mr-1" />
                {t('services.addService', 'Add Service')}
              </Button>
            </div>

            {services.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    {t('services.noServices', 'No services added yet')}
                  </p>
                  <Button className="mt-4" onClick={handleAddService} disabled={!canAddMore}>
                    <Plus className="h-4 w-4 mr-1" />
                    {t('services.addFirstService', 'Add Your First Service')}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              services.map((service) => (
                <Card 
                  key={service.id} 
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => handleEditService(service)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{getCategoryName(service.category)}</h3>
                        {service.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{service.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {service.is_quote_based ? (
                            <Badge variant="secondary">{t('services.quoteBase', 'Quote-based')}</Badge>
                          ) : service.fixed_price ? (
                            <Badge variant="secondary">
                              <DollarSign className="h-3 w-3 mr-1" />
                              R${service.fixed_price}
                            </Badge>
                          ) : service.hourly_rate ? (
                            <Badge variant="secondary">
                              <DollarSign className="h-3 w-3 mr-1" />
                              R${service.hourly_rate}/h
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteService(service.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </AppLayout>
    </>
  );
}
