import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';

interface ServiceCategory {
  id: string;
  name_en: string;
  name_pt: string;
}

export function ProviderServicesEditor() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [initialServices, setInitialServices] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [providerId, setProviderId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        // Fetch provider ID
        const { data: providerData } = await supabase
          .from('providers')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!providerData) {
          setIsLoading(false);
          return;
        }

        setProviderId(providerData.id);

        // Fetch all categories and provider's current services in parallel
        const [categoriesResult, servicesResult] = await Promise.all([
          supabase
            .from('service_categories')
            .select('id, name_en, name_pt')
            .order('order_index'),
          supabase
            .from('provider_services')
            .select('category_id')
            .eq('provider_id', providerData.id)
        ]);

        if (categoriesResult.data) {
          setServiceCategories(categoriesResult.data);
        }

        if (servicesResult.data) {
          const serviceIds = servicesResult.data.map(s => s.category_id);
          setSelectedServices(serviceIds);
          setInitialServices(serviceIds);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const toggleService = (categoryId: string) => {
    setSelectedServices(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const getServiceName = (category: ServiceCategory) => {
    const isPt = i18n.resolvedLanguage?.startsWith('pt') || i18n.language.startsWith('pt');
    return isPt ? category.name_pt : category.name_en;
  };

  const hasChanges = () => {
    if (selectedServices.length !== initialServices.length) return true;
    return !selectedServices.every(id => initialServices.includes(id));
  };

  const handleSave = async () => {
    if (!providerId) return;

    setIsSaving(true);
    try {
      // Find services to add and remove
      const toAdd = selectedServices.filter(id => !initialServices.includes(id));
      const toRemove = initialServices.filter(id => !selectedServices.includes(id));

      // Remove deselected services
      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('provider_services')
          .delete()
          .eq('provider_id', providerId)
          .in('category_id', toRemove);

        if (deleteError) throw deleteError;
      }

      // Add new services
      if (toAdd.length > 0) {
        const newServices = toAdd.map(categoryId => ({
          provider_id: providerId,
          category_id: categoryId,
          is_quote_based: true,
        }));

        const { error: insertError } = await supabase
          .from('provider_services')
          .insert(newServices);

        if (insertError) throw insertError;
      }

      setInitialServices([...selectedServices]);
      toast.success(t('provider.servicesUpdated', 'Services updated successfully'));
    } catch (error: any) {
      console.error('Error saving services:', error);
      toast.error(error.message || t('provider.servicesUpdateError', 'Failed to update services'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!providerId) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('provider.servicesOffered')}</CardTitle>
        <CardDescription>{t('provider.servicesOfferedDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 max-h-[250px] overflow-y-auto">
          {serviceCategories.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={`edit-${category.id}`}
                checked={selectedServices.includes(category.id)}
                onCheckedChange={() => toggleService(category.id)}
              />
              <label
                htmlFor={`edit-${category.id}`}
                className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {getServiceName(category)}
              </label>
            </div>
          ))}
        </div>

        {selectedServices.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {t('provider.servicesSelected', { count: selectedServices.length })}
          </p>
        )}

        <Button
          onClick={handleSave}
          disabled={isSaving || !hasChanges()}
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('common.saving')}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {t('common.save')}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
