import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, Plus, Trash2, Loader2, Package, DollarSign, ChevronRight, 
  Shield, Award, Settings2, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { ProviderAddonsSettings } from '@/components/settings/ProviderAddonsSettings';
import { getLocalizedCategoryName } from '@/lib/i18n-utils';
import { formatPrice } from '@/lib/currency';

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
  warranties?: ServiceWarranty[];
}

interface ServiceWarranty {
  id: string;
  title: string;
  description: string | null;
  warranty_type: string;
  duration_months: number | null;
}

interface ProviderData {
  id: string;
  warranty_info: string | null;
  guarantee_info: string | null;
}

const MAX_SERVICES = 20;

export default function ServicesSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  const [isLoading, setIsLoading] = useState(true);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [services, setServices] = useState<ProviderService[]>([]);
  const [providerData, setProviderData] = useState<ProviderData | null>(null);

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
      const { data: provider } = await supabase
        .from('providers')
        .select('id, warranty_info, guarantee_info')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!provider) {
        toast.error(t('services.providerRequired', 'You need to be a provider to access this page'));
        navigate('/profile');
        return;
      }

      setProviderId(provider.id);
      setProviderData(provider);

      // Fetch existing services with warranties
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
        .eq('provider_id', provider.id);

      // Fetch warranties for all services
      if (servicesData && servicesData.length > 0) {
        const serviceIds = servicesData.map(s => s.id);
        const { data: warrantiesData } = await supabase
          .from('service_warranties')
          .select('*')
          .in('service_id', serviceIds);

        // Map warranties to services
        const servicesWithWarranties = servicesData.map(service => ({
          ...service,
          warranties: warrantiesData?.filter(w => w.service_id === service.id) || []
        }));

        setServices(servicesWithWarranties);
      } else {
        setServices(servicesData || []);
      }
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
    return getLocalizedCategoryName(category, i18n, t);
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


          {/* Services Accordion */}
          <Accordion type="multiple" defaultValue={['services', 'warranties', 'addons']} className="space-y-4">
            {/* Services Section */}
            <AccordionItem value="services" className="border rounded-xl overflow-hidden bg-card">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">{t('services.yourServices', 'Your Services')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {services.length}/{MAX_SERVICES} {t('services.servicesAdded', 'services added')}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="flex justify-end mb-4">
                  <Button size="sm" onClick={handleAddService} disabled={!canAddMore}>
                    <Plus className="h-4 w-4 mr-1" />
                    {t('services.addService', 'Add Service')}
                  </Button>
                </div>

                {services.length === 0 ? (
                  <div className="py-8 text-center border rounded-lg border-dashed">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      {t('services.noServices', 'No services added yet')}
                    </p>
                    <Button className="mt-4" onClick={handleAddService} disabled={!canAddMore}>
                      <Plus className="h-4 w-4 mr-1" />
                      {t('services.addFirstService', 'Add Your First Service')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {services.map((service) => (
                      <Card 
                        key={service.id} 
                        className="cursor-pointer hover:bg-accent/50 transition-colors border-l-4 border-l-primary"
                        onClick={() => handleEditService(service)}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium">{getCategoryName(service.category)}</h3>
                              {service.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{service.description}</p>
                              )}
                              <div className="flex items-center flex-wrap gap-2 mt-2">
                                {service.is_quote_based ? (
                                  <Badge variant="secondary">{t('services.quoteBase', 'Quote-based')}</Badge>
                                ) : service.fixed_price ? (
                                  <Badge variant="secondary">
                                    <DollarSign className="h-3 w-3 mr-1" />
                                    {formatPrice(service.fixed_price)}
                                  </Badge>
                                ) : service.hourly_rate ? (
                                  <Badge variant="secondary">
                                    <DollarSign className="h-3 w-3 mr-1" />
                                    {formatPrice(service.hourly_rate)}/h
                                  </Badge>
                                ) : null}
                                {service.warranties && service.warranties.length > 0 && (
                                  <Badge variant="outline" className="text-primary border-primary">
                                    <Shield className="h-3 w-3 mr-1" />
                                    {service.warranties.length} {t('services.warranties', 'Warranty')}
                                  </Badge>
                                )}
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
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Warranty & Guarantee Section */}
            <AccordionItem value="warranties" className="border rounded-xl overflow-hidden bg-card">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">{t('services.warrantyGuarantee', 'Warranty & Guarantee')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('services.warrantyDescription', 'Build trust with service guarantees')}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  {/* Global Warranty Info */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        {t('services.globalWarranty', 'Service Warranty')}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {t('services.warrantyInfoDesc', 'Describe your warranty policy for all services')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {providerData?.warranty_info || t('services.noWarrantySet', 'No warranty information set')}
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3"
                        onClick={() => navigate('/profile/edit')}
                      >
                        <Settings2 className="h-4 w-4 mr-1" />
                        {t('services.editWarranty', 'Edit Warranty Info')}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Global Guarantee Info */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" />
                        {t('services.satisfactionGuarantee', 'Satisfaction Guarantee')}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {t('services.guaranteeInfoDesc', 'Describe your satisfaction guarantee for customers')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {providerData?.guarantee_info || t('services.noGuaranteeSet', 'No guarantee information set')}
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3"
                        onClick={() => navigate('/profile/edit')}
                      >
                        <Settings2 className="h-4 w-4 mr-1" />
                        {t('services.editGuarantee', 'Edit Guarantee Info')}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Add-ons Section */}
            <AccordionItem value="addons" className="border rounded-xl overflow-hidden bg-card">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">{t('services.addOns', 'Add-ons')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('services.addOnsDescription', 'Extra services customers can add')}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {providerId && <ProviderAddonsSettings providerId={providerId} />}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </AppLayout>
    </>
  );
}
