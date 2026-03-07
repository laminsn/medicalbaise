import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, Loader2, Plus, Trash2, DollarSign, Package, Shield, Award
} from 'lucide-react';
import { toast } from 'sonner';
import { getLocalizedCategoryName } from '@/lib/i18n-utils';

interface ServiceAddon {
  id?: string;
  name: string;
  description: string;
  price: number;
  isNew?: boolean;
  isDeleted?: boolean;
}

interface ServiceWarranty {
  id?: string;
  title: string;
  description: string;
  warranty_type: 'warranty' | 'guarantee';
  duration_months: number | null;
  isNew?: boolean;
  isDeleted?: boolean;
}

export default function ServiceEditor() {
  const { serviceId } = useParams();
  const isNewService = serviceId === 'new';
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [savedServiceId, setSavedServiceId] = useState<string | null>(null);
  const [dbCategories, setDbCategories] = useState<Array<{ id: string; name_en: string; name_pt: string }>>([]);
  
  // Form state
  const [selectedCategory, setSelectedCategory] = useState('');
  const [description, setDescription] = useState('');
  const [pricingType, setPricingType] = useState<'hourly' | 'fixed' | 'quote'>('hourly');
  const [hourlyRate, setHourlyRate] = useState('');
  const [fixedPrice, setFixedPrice] = useState('');
  const [addons, setAddons] = useState<ServiceAddon[]>([]);
  const [warranties, setWarranties] = useState<ServiceWarranty[]>([]);
  
  // Selected service options (checkboxes)
  const [includesConsultation, setIncludesConsultation] = useState(false);
  const [includesMaterials, setIncludesMaterials] = useState(false);
  const [includesCleanup, setIncludesCleanup] = useState(false);
  const [isEmergencyAvailable, setIsEmergencyAvailable] = useState(false);
  const [isWeekendAvailable, setIsWeekendAvailable] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      navigate('/auth');
    }
  }, [user, serviceId]);

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

      // Fetch categories from database
      const { data: categoriesData } = await supabase
        .from('service_categories')
        .select('id, name_en, name_pt')
        .order('order_index');

      setDbCategories(categoriesData || []);

      // If editing existing service
      if (!isNewService && serviceId) {
        setSavedServiceId(serviceId);
        
        const { data: serviceData } = await supabase
          .from('provider_services')
          .select('*')
          .eq('id', serviceId)
          .eq('provider_id', providerData.id)
          .maybeSingle();

        if (serviceData) {
          setSelectedCategory(serviceData.category_id);
          setDescription(serviceData.description || '');
          
          if (serviceData.is_quote_based) {
            setPricingType('quote');
          } else if (serviceData.fixed_price) {
            setPricingType('fixed');
            setFixedPrice(serviceData.fixed_price.toString());
          } else {
            setPricingType('hourly');
            setHourlyRate(serviceData.hourly_rate?.toString() || '');
          }
        }

        // Fetch addons for this provider
        const { data: addonsData } = await supabase
          .from('provider_addons')
          .select('*')
          .eq('provider_id', providerData.id);

        if (addonsData) {
          setAddons(addonsData.map(addon => ({
            id: addon.id,
            name: addon.name,
            description: addon.description || '',
            price: addon.price,
          })));
        }

        // Fetch warranties for this service
        const { data: warrantiesData } = await supabase
          .from('service_warranties')
          .select('*')
          .eq('service_id', serviceId);

        if (warrantiesData) {
          setWarranties(warrantiesData.map(w => ({
            id: w.id,
            title: w.title,
            description: w.description || '',
            warranty_type: w.warranty_type as 'warranty' | 'guarantee',
            duration_months: w.duration_months,
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!providerId || !selectedCategory) {
      toast.error(t('services.selectCategory', 'Please select a category'));
      return;
    }

    setIsSaving(true);
    try {
      const serviceData = {
        provider_id: providerId,
        category_id: selectedCategory,
        description: description.trim() || null,
        hourly_rate: pricingType === 'hourly' ? parseFloat(hourlyRate) || null : null,
        fixed_price: pricingType === 'fixed' ? parseFloat(fixedPrice) || null : null,
        is_quote_based: pricingType === 'quote',
      };

      let currentServiceId = savedServiceId;

      if (isNewService) {
        const { data, error } = await supabase
          .from('provider_services')
          .insert(serviceData)
          .select('id')
          .single();

        if (error) throw error;
        currentServiceId = data.id;
        toast.success(t('services.serviceAdded', 'Service added'));
      } else {
        const { error } = await supabase
          .from('provider_services')
          .update(serviceData)
          .eq('id', serviceId)
          .eq('provider_id', providerId);

        if (error) throw error;
        toast.success(t('services.serviceUpdated', 'Service updated'));
      }

      // Save addons
      for (const addon of addons) {
        if (addon.isDeleted && addon.id) {
          await supabase.from('provider_addons').delete().eq('id', addon.id).eq('provider_id', providerId);
        } else if (addon.isNew && !addon.isDeleted) {
          await supabase
            .from('provider_addons')
            .insert({
              provider_id: providerId,
              name: addon.name,
              description: addon.description || null,
              price: addon.price,
              is_active: true,
            });
        } else if (addon.id && !addon.isDeleted) {
          await supabase
            .from('provider_addons')
            .update({
              name: addon.name,
              description: addon.description || null,
              price: addon.price,
            })
            .eq('id', addon.id)
            .eq('provider_id', providerId);
        }
      }

      // Save warranties
      if (currentServiceId) {
        for (const warranty of warranties) {
          if (warranty.isDeleted && warranty.id) {
            await supabase.from('service_warranties').delete().eq('id', warranty.id).eq('service_id', currentServiceId);
          } else if (warranty.isNew && !warranty.isDeleted) {
            await supabase
              .from('service_warranties')
              .insert({
                service_id: currentServiceId,
                title: warranty.title,
                description: warranty.description || null,
                warranty_type: warranty.warranty_type,
                duration_months: warranty.duration_months,
              });
          } else if (warranty.id && !warranty.isDeleted) {
            await supabase
              .from('service_warranties')
              .update({
                title: warranty.title,
                description: warranty.description || null,
                warranty_type: warranty.warranty_type,
                duration_months: warranty.duration_months,
              })
              .eq('id', warranty.id)
              .eq('service_id', currentServiceId);
          }
        }
      }

      navigate('/services');
    } catch (error: any) {
      console.error('Error saving service:', error);
      toast.error(error.message || t('common.error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAddon = () => {
    setAddons([...addons, { name: '', description: '', price: 0, isNew: true }]);
  };

  const handleRemoveAddon = (index: number) => {
    const addon = addons[index];
    if (addon.id) {
      // Mark for deletion
      const updated = [...addons];
      updated[index] = { ...addon, isDeleted: true };
      setAddons(updated);
    } else {
      setAddons(addons.filter((_, i) => i !== index));
    }
  };

  const updateAddon = (index: number, field: keyof ServiceAddon, value: string | number) => {
    const updated = [...addons];
    updated[index] = { ...updated[index], [field]: value };
    setAddons(updated);
  };

  const handleAddWarranty = () => {
    setWarranties([...warranties, { 
      title: '', 
      description: '', 
      warranty_type: 'warranty', 
      duration_months: null, 
      isNew: true 
    }]);
  };

  const handleRemoveWarranty = (index: number) => {
    const warranty = warranties[index];
    if (warranty.id) {
      // Mark for deletion
      const updated = [...warranties];
      updated[index] = { ...warranty, isDeleted: true };
      setWarranties(updated);
    } else {
      setWarranties(warranties.filter((_, i) => i !== index));
    }
  };

  const updateWarranty = (index: number, field: keyof ServiceWarranty, value: string | number | null) => {
    const updated = [...warranties];
    updated[index] = { ...updated[index], [field]: value };
    setWarranties(updated);
  };

  const getCategoryName = (category: { name_en: string; name_pt: string }) => {
    return getLocalizedCategoryName(category, i18n, t);
  };

  const activeAddons = addons.filter(a => !a.isDeleted);
  const activeWarranties = warranties.filter(w => !w.isDeleted);

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
        <title>{isNewService ? t('services.addService', 'Add Service') : t('services.editService', 'Edit Service')} - Brasil Base</title>
      </Helmet>
      <AppLayout>
        <div className="px-4 py-6 pb-24 max-w-lg mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/services')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">
                {isNewService ? t('services.addService', 'Add Service') : t('services.editService', 'Edit Service')}
              </h1>
            </div>
          </div>

          {/* Service Category */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base">{t('services.category', 'Service Category')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder={t('services.selectCategory', 'Select a category')} />
                </SelectTrigger>
                <SelectContent>
                  {dbCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {getCategoryName(cat)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Service Description */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base">{t('services.description', 'Description')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder={t('services.descriptionPlaceholder', 'Describe your service...')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Service Options (Checkboxes) */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base">{t('services.serviceOptions', 'Service Options')}</CardTitle>
              <CardDescription>{t('services.selectWhatIncluded', 'Select what\'s included in your service')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="consultation" checked={includesConsultation} onCheckedChange={(c) => setIncludesConsultation(!!c)} />
                <Label htmlFor="consultation">{t('services.freeConsultation', 'Free Consultation')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="materials" checked={includesMaterials} onCheckedChange={(c) => setIncludesMaterials(!!c)} />
                <Label htmlFor="materials">{t('services.materialsIncluded', 'Materials Included')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="cleanup" checked={includesCleanup} onCheckedChange={(c) => setIncludesCleanup(!!c)} />
                <Label htmlFor="cleanup">{t('services.cleanupIncluded', 'Cleanup Included')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="emergency" checked={isEmergencyAvailable} onCheckedChange={(c) => setIsEmergencyAvailable(!!c)} />
                <Label htmlFor="emergency">{t('services.emergencyService', 'Emergency Service Available')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="weekend" checked={isWeekendAvailable} onCheckedChange={(c) => setIsWeekendAvailable(!!c)} />
                <Label htmlFor="weekend">{t('services.weekendAvailable', 'Weekend Availability')}</Label>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                {t('services.pricing', 'Pricing')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('services.pricingType', 'Pricing Type')}</Label>
                <Select value={pricingType} onValueChange={(v: 'hourly' | 'fixed' | 'quote') => setPricingType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">{t('services.hourlyRate', 'Hourly Rate')}</SelectItem>
                    <SelectItem value="fixed">{t('services.fixedPrice', 'Fixed Price')}</SelectItem>
                    <SelectItem value="quote">{t('services.quoteBase', 'Quote-based')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {pricingType === 'hourly' && (
                <div className="space-y-2">
                  <Label>{t('services.hourlyRate', 'Hourly Rate')} (R$)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                  />
                </div>
              )}

              {pricingType === 'fixed' && (
                <div className="space-y-2">
                  <Label>{t('services.fixedPrice', 'Fixed Price')} (R$)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={fixedPrice}
                    onChange={(e) => setFixedPrice(e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Warranties & Guarantees */}
          <Card className="mb-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    {t('services.warrantiesGuarantees', 'Warranties & Guarantees')}
                  </CardTitle>
                  <CardDescription>{t('services.warrantiesDescription', 'Build trust with your customers')}</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={handleAddWarranty}>
                  <Plus className="h-4 w-4 mr-1" />
                  {t('common.add', 'Add')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeWarranties.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('services.noWarranties', 'No warranties or guarantees yet. Add them to build trust.')}
                </p>
              ) : (
                activeWarranties.map((warranty, idx) => {
                  const index = warranties.findIndex(w => w === warranty);
                  return (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {warranty.warranty_type === 'warranty' ? (
                            <Shield className="h-4 w-4 text-primary" />
                          ) : (
                            <Award className="h-4 w-4 text-primary" />
                          )}
                          <Label>{t('services.warrantyTitle', 'Title')}</Label>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleRemoveWarranty(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <Select 
                        value={warranty.warranty_type} 
                        onValueChange={(v: 'warranty' | 'guarantee') => updateWarranty(index, 'warranty_type', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="warranty">{t('services.warranty', 'Warranty')}</SelectItem>
                          <SelectItem value="guarantee">{t('services.guarantee', 'Guarantee')}</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Input
                        placeholder={t('services.warrantyTitlePlaceholder', 'e.g., 1-Year Service Warranty')}
                        value={warranty.title}
                        onChange={(e) => updateWarranty(index, 'title', e.target.value)}
                      />
                      
                      <Textarea
                        placeholder={t('services.warrantyDescPlaceholder', 'Describe what\'s covered...')}
                        value={warranty.description}
                        onChange={(e) => updateWarranty(index, 'description', e.target.value)}
                        rows={2}
                      />
                      
                      <div className="space-y-1">
                        <Label className="text-sm">{t('services.durationMonths', 'Duration (months)')}</Label>
                        <Input
                          type="number"
                          placeholder={t('services.optional', 'Optional')}
                          value={warranty.duration_months || ''}
                          onChange={(e) => updateWarranty(index, 'duration_months', e.target.value ? parseInt(e.target.value) : null)}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Add-ons */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    {t('services.addons', 'Add-ons')}
                  </CardTitle>
                  <CardDescription>{t('services.addonsDescription', 'Optional extras customers can add')}</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={handleAddAddon}>
                  <Plus className="h-4 w-4 mr-1" />
                  {t('common.add', 'Add')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeAddons.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('services.noAddons', 'No add-ons yet. Add optional extras for your service.')}
                </p>
              ) : (
                activeAddons.map((addon, idx) => {
                  const index = addons.findIndex(a => a === addon);
                  return (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>{t('services.addonName', 'Add-on Name')}</Label>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleRemoveAddon(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        placeholder={t('services.addonNamePlaceholder', 'e.g., Express Service')}
                        value={addon.name}
                        onChange={(e) => updateAddon(index, 'name', e.target.value)}
                      />
                      <Input
                        placeholder={t('services.addonDescPlaceholder', 'Brief description')}
                        value={addon.description}
                        onChange={(e) => updateAddon(index, 'description', e.target.value)}
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">R$</span>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={addon.price}
                          onChange={(e) => updateAddon(index, 'price', parseFloat(e.target.value) || 0)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button onClick={handleSave} disabled={isSaving} className="w-full" size="lg">
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t('common.save', 'Save')}
          </Button>
        </div>
      </AppLayout>
    </>
  );
}
