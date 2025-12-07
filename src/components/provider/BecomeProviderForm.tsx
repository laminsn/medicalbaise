import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Upload, X, FileText, Image } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { LanguageFluencySelector } from '@/components/LanguageFluencySelector';

interface ServiceCategory {
  id: string;
  name_en: string;
  name_pt: string;
}

const formSchema = z.object({
  business_name: z.string().min(2, 'Business name must be at least 2 characters'),
  business_type: z.enum(['individual', 'company']),
  tagline: z.string().max(100, 'Tagline must be 100 characters or less').optional(),
  bio: z.string().min(20, 'Bio must be at least 20 characters').max(500, 'Bio must be 500 characters or less'),
  years_experience: z.coerce.number().min(0).max(50),
  address: z.string().min(5, 'Please enter a valid address'),
  service_radius_km: z.coerce.number().min(1).max(100),
  // Identity verification
  id_type: z.enum(['cpf_cnpj', 'alternative']),
  cpf_cnpj: z.string().optional(),
  passport_number: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal('')),
}).refine((data) => {
  if (data.id_type === 'cpf_cnpj') {
    return data.cpf_cnpj && data.cpf_cnpj.length >= 11;
  }
  return true;
}, {
  message: 'CPF/CNPJ is required',
  path: ['cpf_cnpj'],
}).refine((data) => {
  if (data.id_type === 'alternative') {
    return data.passport_number && data.passport_number.length >= 5;
  }
  return true;
}, {
  message: 'Passport number is required',
  path: ['passport_number'],
}).refine((data) => {
  if (data.id_type === 'alternative') {
    return data.contact_phone && data.contact_phone.length >= 10;
  }
  return true;
}, {
  message: 'Phone number is required',
  path: ['contact_phone'],
}).refine((data) => {
  if (data.id_type === 'alternative') {
    return data.contact_email && data.contact_email.length > 0;
  }
  return true;
}, {
  message: 'Email is required',
  path: ['contact_email'],
});

type FormData = z.infer<typeof formSchema>;

interface UploadedFile {
  file: File;
  preview: string;
  name: string;
}

interface BecomeProviderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BecomeProviderForm({ open, onOpenChange, onSuccess }: BecomeProviderFormProps) {
  const { t, i18n } = useTranslation();
  const { user, updateProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [certifications, setCertifications] = useState<UploadedFile[]>([]);
  const [uploadingCerts, setUploadingCerts] = useState(false);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['portuguese']);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      business_name: '',
      business_type: 'individual',
      tagline: '',
      bio: '',
      years_experience: 0,
      address: '',
      service_radius_km: 20,
      id_type: 'cpf_cnpj',
      cpf_cnpj: '',
      passport_number: '',
      contact_phone: '',
      contact_email: '',
    },
  });

  const idType = form.watch('id_type');

  // Fetch service categories
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('service_categories')
        .select('id, name_en, name_pt')
        .order('order_index');
      
      if (!error && data) {
        setServiceCategories(data);
      }
    };
    
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const toggleService = (categoryId: string) => {
    setSelectedServices(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const getServiceName = (category: ServiceCategory) => {
    return i18n.language === 'pt' ? category.name_pt : category.name_en;
  };

  const handleCertificationUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    Array.from(files).forEach((file) => {
      if (!validTypes.includes(file.type)) {
        toast.error(t('provider.invalidFileType'));
        return;
      }
      if (file.size > maxSize) {
        toast.error(t('provider.fileTooLarge'));
        return;
      }

      const preview = file.type.startsWith('image/') 
        ? URL.createObjectURL(file) 
        : '';

      setCertifications((prev) => [
        ...prev,
        { file, preview, name: file.name },
      ]);
    });

    e.target.value = '';
  };

  const removeCertification = (index: number) => {
    setCertifications((prev) => {
      const newCerts = [...prev];
      if (newCerts[index].preview) {
        URL.revokeObjectURL(newCerts[index].preview);
      }
      newCerts.splice(index, 1);
      return newCerts;
    });
  };

  const uploadCertifications = async (providerId: string): Promise<string[]> => {
    if (!user || certifications.length === 0) return [];

    const uploadedUrls: string[] = [];

    for (const cert of certifications) {
      const fileExt = cert.file.name.split('.').pop();
      const fileName = `${user.id}/${providerId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('certifications')
        .upload(fileName, cert.file);

      if (uploadError) {
        console.error('Error uploading certification:', uploadError);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('certifications')
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast.error(t('auth.loginRequired'));
      return;
    }

    setIsSubmitting(true);

    try {
      // Create provider profile
      const { data: providerData, error: providerError } = await supabase
        .from('providers')
        .insert({
          user_id: user.id,
          business_name: data.business_name,
          business_type: data.business_type,
          tagline: data.tagline || null,
          bio: data.bio,
          years_experience: data.years_experience,
          address: data.address,
          service_radius_km: data.service_radius_km,
          id_type: data.id_type,
          cpf_cnpj: data.id_type === 'cpf_cnpj' ? data.cpf_cnpj : null,
          passport_number: data.id_type === 'alternative' ? data.passport_number : null,
          contact_phone: data.id_type === 'alternative' ? data.contact_phone : null,
          contact_email: data.id_type === 'alternative' ? data.contact_email : null,
          requires_background_check: data.id_type === 'alternative',
          languages: selectedLanguages,
        })
        .select('id')
        .single();

      if (providerError) throw providerError;

      // Upload certifications
      if (certifications.length > 0 && providerData) {
        setUploadingCerts(true);
        const certUrls = await uploadCertifications(providerData.id);
        
        // Save certification records
        for (const url of certUrls) {
          await supabase.from('provider_credentials').insert({
            provider_id: providerData.id,
            credential_type: 'certification',
            title: 'Uploaded Certification',
            document_url: url,
          });
        }
        setUploadingCerts(false);
      }

      // Save selected services
      if (selectedServices.length > 0 && providerData) {
        const servicesInserts = selectedServices.map(categoryId => ({
          provider_id: providerData.id,
          category_id: categoryId,
          is_quote_based: true,
        }));
        
        const { error: servicesError } = await supabase
          .from('provider_services')
          .insert(servicesInserts);
        
        if (servicesError) {
          console.error('Error saving services:', servicesError);
        }
      }

      // Update user profile type to provider
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ user_type: 'provider' })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Update local profile state
      await updateProfile({ user_type: 'provider' });

      toast.success(t('provider.registrationSuccess'));
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating provider profile:', error);
      toast.error(error.message || t('provider.registrationError'));
    } finally {
      setIsSubmitting(false);
      setUploadingCerts(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('provider.becomeProvider')}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="business_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('provider.businessName')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('provider.businessNamePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="business_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('provider.businessType')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('provider.selectBusinessType')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="individual">{t('provider.individual')}</SelectItem>
                      <SelectItem value="company">{t('provider.company')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Identity Verification Section */}
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <h3 className="font-medium">{t('provider.identityVerification')}</h3>
              
              <FormField
                control={form.control}
                name="id_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('provider.idType')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cpf_cnpj">{t('provider.cpfCnpj')}</SelectItem>
                        <SelectItem value="alternative">{t('provider.alternativeId')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {idType === 'cpf_cnpj' 
                        ? t('provider.cpfCnpjDescription') 
                        : t('provider.alternativeIdDescription')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {idType === 'cpf_cnpj' ? (
                <FormField
                  control={form.control}
                  name="cpf_cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('provider.cpfCnpjNumber')}</FormLabel>
                      <FormControl>
                        <Input placeholder="000.000.000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <>
                  <FormField
                    control={form.control}
                    name="passport_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('provider.passportNumber')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('provider.passportPlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('provider.contactPhone')}</FormLabel>
                        <FormControl>
                          <Input placeholder="+55 11 99999-9999" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('provider.contactEmail')}</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center gap-2 p-3 rounded-md bg-amber-500/10 border border-amber-500/20">
                    <Checkbox checked disabled />
                    <span className="text-sm text-amber-700 dark:text-amber-400">
                      {t('provider.backgroundCheckRequired')}
                    </span>
                  </div>
                </>
              )}
            </div>

            <FormField
              control={form.control}
              name="tagline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('provider.tagline')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('provider.taglinePlaceholder')} {...field} />
                  </FormControl>
                  <FormDescription>{t('provider.taglineDescription')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('provider.bio')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('provider.bioPlaceholder')} 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>{t('provider.bioDescription')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="years_experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('provider.yearsExperience')}</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={50} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="service_radius_km"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('provider.serviceRadius')}</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={100} {...field} />
                    </FormControl>
                    <FormDescription>km</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('provider.address')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('provider.addressPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Services Offered */}
            <div className="border rounded-lg p-4 space-y-3">
              <Label>{t('provider.servicesOffered')}</Label>
              <FormDescription>{t('provider.servicesOfferedDescription')}</FormDescription>
              
              <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                {serviceCategories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={category.id}
                      checked={selectedServices.includes(category.id)}
                      onCheckedChange={() => toggleService(category.id)}
                    />
                    <label
                      htmlFor={category.id}
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
            </div>

            {/* Language Fluency */}
            <div className="border rounded-lg p-4 space-y-3">
              <LanguageFluencySelector
                selectedLanguages={selectedLanguages}
                onLanguagesChange={setSelectedLanguages}
                label={t('profile.languageFluency')}
                description={t('profile.languageFluencyDescription')}
              />
            </div>

            {/* Certifications Upload */}
            <div className="border rounded-lg p-4 space-y-3">
              <Label>{t('provider.certifications')}</Label>
              <FormDescription>{t('provider.certificationsDescription')}</FormDescription>
              
              <div className="flex flex-wrap gap-2">
                {certifications.map((cert, index) => (
                  <div 
                    key={index} 
                    className="relative group border rounded-lg p-2 bg-muted/30 flex items-center gap-2"
                  >
                    {cert.preview ? (
                      <img src={cert.preview} alt={cert.name} className="w-10 h-10 object-cover rounded" />
                    ) : (
                      <FileText className="w-10 h-10 text-muted-foreground" />
                    )}
                    <span className="text-sm truncate max-w-[100px]">{cert.name}</span>
                    <button
                      type="button"
                      onClick={() => removeCertification(index)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t('provider.uploadCertifications')}</span>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  multiple
                  onChange={handleCertificationUpload}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-muted-foreground">
                {t('provider.acceptedFormats')}
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploadingCerts ? t('provider.uploadingCertifications') : t('common.loading')}
                </>
              ) : (
                t('provider.createProfile')
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}