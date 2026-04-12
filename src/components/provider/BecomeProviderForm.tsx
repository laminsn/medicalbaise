import { useState, useEffect, useMemo } from 'react';
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
import { Loader2, Upload, X, FileText, ShieldCheck } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { LanguageFluencySelector } from '@/components/LanguageFluencySelector';
import { isPortuguese, isSpanish } from '@/lib/i18n-utils';
import { MEDICAL_CATEGORIES, INSURANCE_PROVIDERS } from '@/lib/constants/medical';

const CONSULTATION_DURATIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
];

interface ServiceCategory {
  id: string;
  name_en: string;
  name_pt: string;
}

const createFormSchema = (isPt: boolean, isEs: boolean) => z.object({
  business_name: z.string().min(2, isPt ? 'Nome comercial deve ter pelo menos 2 caracteres' : isEs ? 'El nombre comercial debe tener al menos 2 caracteres' : 'Business name must be at least 2 characters'),
  business_type: z.enum(['individual', 'company']),
  tagline: z.string().max(100, isPt ? 'Slogan deve ter no máximo 100 caracteres' : isEs ? 'El eslogan debe tener 100 caracteres o menos' : 'Tagline must be 100 characters or less').optional(),
  bio: z
    .string()
    .min(20, isPt ? 'Bio deve ter pelo menos 20 caracteres' : isEs ? 'La biografía debe tener al menos 20 caracteres' : 'Bio must be at least 20 characters')
    .max(500, isPt ? 'Bio deve ter no máximo 500 caracteres' : isEs ? 'La biografía debe tener 500 caracteres o menos' : 'Bio must be 500 characters or less'),
  years_experience: z.coerce.number().min(0).max(50),
  address: z.string().min(5, isPt ? 'Informe um endereço válido' : isEs ? 'Ingresa una dirección válida' : 'Please enter a valid address'),
  service_radius_km: z.coerce.number().min(1).max(100),
  // Identity verification
  id_type: z.enum(['cpf_cnpj', 'alternative']),
  cpf_cnpj: z.string().optional(),
  passport_number: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal('')),
  // Medical credentials
  crm_number: z.string().min(5, isPt ? 'Número CRM inválido' : 'Invalid CRM number'),
  medical_specialty: z.string().min(1, isPt ? 'Selecione uma especialidade' : 'Please select a specialty'),
  sub_specialty: z.string().optional(),
  medical_school: z.string().min(2, isPt ? 'Informe a faculdade de medicina' : 'Please enter your medical school'),
  graduation_year: z.coerce.number()
    .min(1950, isPt ? 'Ano de graduação inválido' : 'Invalid graduation year')
    .max(new Date().getFullYear(), isPt ? 'O ano não pode ser no futuro' : 'Year cannot be in the future'),
  residency_program: z.string().optional(),
  hospital_affiliations_text: z.string().optional(),
  accepted_insurance: z.array(z.string()).optional(),
  consultation_fee: z.coerce.number().min(0).optional(),
  consultation_duration_minutes: z.coerce.number().optional(),
  teleconsultation_available: z.boolean().optional(),
  accepts_new_patients: z.boolean().optional(),
  // Credential verification
  credential_certification: z.boolean().refine(val => val === true, {
    message: isPt ? 'Você deve certificar suas credenciais' : isEs ? 'Debes certificar tus credenciales' : 'You must certify your credentials',
  }),
  credential_documents: z.any().optional(),
}).refine((data) => {
  if (data.id_type === 'cpf_cnpj') {
    return data.cpf_cnpj && data.cpf_cnpj.length >= 11;
  }
  return true;
}, {
  message: isPt ? 'CPF/CNPJ é obrigatório' : isEs ? 'El CPF/CNPJ es obligatorio' : 'CPF/CNPJ is required',
  path: ['cpf_cnpj'],
}).refine((data) => {
  if (data.id_type === 'alternative') {
    return data.passport_number && data.passport_number.length >= 5;
  }
  return true;
}, {
  message: isPt ? 'Número do passaporte é obrigatório' : isEs ? 'El número de pasaporte es obligatorio' : 'Passport number is required',
  path: ['passport_number'],
}).refine((data) => {
  if (data.id_type === 'alternative') {
    return data.contact_phone && data.contact_phone.length >= 10;
  }
  return true;
}, {
  message: isPt ? 'Telefone é obrigatório' : isEs ? 'El teléfono es obligatorio' : 'Phone number is required',
  path: ['contact_phone'],
}).refine((data) => {
  if (data.id_type === 'alternative') {
    return data.contact_email && data.contact_email.length > 0;
  }
  return true;
}, {
  message: isPt ? 'E-mail é obrigatório' : isEs ? 'El correo electrónico es obligatorio' : 'Email is required',
  path: ['contact_email'],
});

type FormData = z.infer<ReturnType<typeof createFormSchema>>;

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
  const isPt = i18n.resolvedLanguage?.startsWith('pt') || i18n.language.startsWith('pt');
  const isEs = i18n.resolvedLanguage?.startsWith('es') || i18n.language.startsWith('es');
  const { user, updateProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [certifications, setCertifications] = useState<UploadedFile[]>([]);
  const [uploadingCerts, setUploadingCerts] = useState(false);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['portuguese']);
  const formSchema = useMemo(() => createFormSchema(isPt, isEs), [isPt, isEs]);

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
      crm_number: '',
      medical_specialty: '',
      sub_specialty: '',
      medical_school: '',
      graduation_year: new Date().getFullYear() - 5,
      residency_program: '',
      hospital_affiliations_text: '',
      accepted_insurance: [],
      consultation_fee: undefined,
      consultation_duration_minutes: 30,
      teleconsultation_available: false,
      accepts_new_patients: true,
      credential_certification: false,
      credential_documents: undefined,
    },
  });

  const selectedInsurance = form.watch('accepted_insurance') ?? [];

  const toggleInsuranceItem = (value: string) => {
    const current = form.getValues('accepted_insurance') ?? [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    form.setValue('accepted_insurance', updated);
  };

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
    if (isPortuguese(i18n)) return category.name_pt;
    if (isSpanish(i18n)) {
      return t(`medicalCategories.${category.id}.name`, category.name_en);
    }
    return category.name_en;
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
      // Parse hospital affiliations from comma-separated text
      const hospitalAffiliations = data.hospital_affiliations_text
        ? data.hospital_affiliations_text.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

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
          // Medical credentials
          crm_number: data.crm_number,
          accepted_insurance: data.accepted_insurance ?? [],
          hospital_affiliations: hospitalAffiliations,
          consultation_fee: data.consultation_fee ?? null,
          consultation_duration_minutes: data.consultation_duration_minutes ?? null,
          teleconsultation_available: data.teleconsultation_available ?? false,
          accepts_new_patients: data.accepts_new_patients ?? true,
        })
        .select('id')
        .single();

      if (providerError) throw providerError;

      // Save education credentials (medical school + residency)
      if (providerData) {
        const educationCredentials = [
          {
            provider_id: providerData.id,
            credential_type: 'education',
            title: isPt ? 'Graduação em Medicina' : 'Medical Degree',
            institution: data.medical_school,
            year: data.graduation_year.toString(),
          },
          ...(data.residency_program ? [{
            provider_id: providerData.id,
            credential_type: 'residency',
            title: data.residency_program,
            institution: data.residency_program,
            year: null,
          }] : []),
          ...(data.sub_specialty ? [{
            provider_id: providerData.id,
            credential_type: 'certification',
            title: data.sub_specialty,
            institution: '',
            year: null,
          }] : []),
        ];

        if (educationCredentials.length > 0) {
          await supabase.from('provider_credentials').insert(educationCredentials);
        }
      }

      // Upload certifications
      if (certifications.length > 0 && providerData) {
        setUploadingCerts(true);
        const certUrls = await uploadCertifications(providerData.id);
        
        // Save certification records
        for (const url of certUrls) {
          await supabase.from('provider_credentials').insert({
            provider_id: providerData.id,
            credential_type: 'certification',
            title: isPt ? 'Certificação enviada' : isEs ? 'Certificación subida' : 'Uploaded Certification',
            document_url: url,
          });
        }
        setUploadingCerts(false);
      }

      // Update category_id from medical specialty selection
      if (providerData && data.medical_specialty) {
        await supabase
          .from('providers')
          .update({ category_id: data.medical_specialty })
          .eq('id', providerData.id);
      }

      // Save selected services
      const allServiceIds = Array.from(new Set([
        ...selectedServices,
        ...(data.medical_specialty ? [data.medical_specialty] : []),
      ]));

      if (allServiceIds.length > 0 && providerData) {
        const servicesInserts = allServiceIds.map(categoryId => ({
          provider_id: providerData.id,
          category_id: categoryId,
          is_quote_based: true,
        }));

        await supabase.from('provider_services').insert(servicesInserts);
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

            {/* Medical Credentials Section */}
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <h3 className="font-medium flex items-center gap-2">
                {isPt ? 'Credenciais Médicas' : 'Medical Credentials'}
              </h3>

              {/* CRM Number */}
              <FormField
                control={form.control}
                name="crm_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isPt ? 'CRM / Número do Registro Médico' : 'CRM / Medical License Number'}
                      <span className="text-destructive"> *</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., CRM/SP 123456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Medical Specialty */}
              <FormField
                control={form.control}
                name="medical_specialty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isPt ? 'Especialidade Médica' : 'Medical Specialty'}
                      <span className="text-destructive"> *</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isPt ? 'Selecione uma especialidade' : 'Select a specialty'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MEDICAL_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {isPt ? cat.name_pt : cat.name_en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sub-specialty */}
              <FormField
                control={form.control}
                name="sub_specialty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isPt ? 'Subespecialidade (opcional)' : 'Sub-specialty (optional)'}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={isPt ? 'ex: Cardiologia Pediátrica' : 'e.g., Pediatric Cardiology'}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Medical School */}
              <FormField
                control={form.control}
                name="medical_school"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isPt ? 'Faculdade de Medicina' : 'Medical School'}
                      <span className="text-destructive"> *</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={isPt ? 'ex: USP - Faculdade de Medicina' : 'e.g., USP - Faculdade de Medicina'}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Graduation Year */}
              <FormField
                control={form.control}
                name="graduation_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isPt ? 'Ano de Formatura' : 'Graduation Year'}
                      <span className="text-destructive"> *</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1950}
                        max={new Date().getFullYear()}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Residency Program */}
              <FormField
                control={form.control}
                name="residency_program"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isPt ? 'Programa de Residência (opcional)' : 'Residency Program (optional)'}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={isPt ? 'ex: Residência em Cardiologia — InCor' : 'e.g., Cardiology Residency — InCor'}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Hospital Affiliations */}
              <FormField
                control={form.control}
                name="hospital_affiliations_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isPt ? 'Vínculos Hospitalares (opcional)' : 'Hospital Affiliations (optional)'}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={isPt ? 'ex: Hospital Albert Einstein, Hospital Sírio-Libanês' : 'e.g., Hospital Albert Einstein, Hospital Sírio-Libanês'}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {isPt ? 'Separe os hospitais por vírgula' : 'Separate hospitals with commas'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Accepted Insurance Plans */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {isPt ? 'Planos de Saúde Aceitos (opcional)' : 'Accepted Insurance Plans (optional)'}
                </Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {[
                    ...INSURANCE_PROVIDERS,
                    isPt ? 'Particular (sem plano)' : 'Particular (out-of-pocket)',
                    'SUS',
                  ].map((plan) => (
                    <div key={plan} className="flex items-center space-x-2">
                      <Checkbox
                        id={`insurance-${plan}`}
                        checked={selectedInsurance.includes(plan)}
                        onCheckedChange={() => toggleInsuranceItem(plan)}
                      />
                      <label
                        htmlFor={`insurance-${plan}`}
                        className="text-sm leading-none cursor-pointer"
                      >
                        {plan}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Consultation Fee */}
              <FormField
                control={form.control}
                name="consultation_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isPt ? 'Valor da Consulta (opcional)' : 'Consultation Fee (optional)'}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                        <Input
                          type="number"
                          min={0}
                          placeholder="e.g., 250"
                          className="pl-9"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Consultation Duration */}
              <FormField
                control={form.control}
                name="consultation_duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isPt ? 'Duração da Consulta (opcional)' : 'Consultation Duration (optional)'}</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(Number(v))}
                      value={field.value ? String(field.value) : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isPt ? 'Selecione a duração' : 'Select duration'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CONSULTATION_DURATIONS.map((d) => (
                          <SelectItem key={d.value} value={String(d.value)}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Teleconsultation Available */}
              <FormField
                control={form.control}
                name="teleconsultation_available"
                render={({ field }) => (
                  <FormItem className="flex items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-0.5">
                      <FormLabel className="font-normal cursor-pointer">
                        {isPt
                          ? 'Ofereço teleconsulta / consultas por vídeo'
                          : 'I offer teleconsultation / video appointments'}
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {/* Accepts New Patients */}
              <FormField
                control={form.control}
                name="accepts_new_patients"
                render={({ field }) => (
                  <FormItem className="flex items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value ?? true}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-0.5">
                      <FormLabel className="font-normal cursor-pointer">
                        {isPt
                          ? 'Estou aceitando novos pacientes'
                          : 'Currently accepting new patients'}
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
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

            {/* Credential Verification */}
            <div className="space-y-4 border-t border-border pt-6">
              <h3 className="text-lg font-semibold text-foreground">
                {t('provider.credentialVerification', 'Credential Verification')}
              </h3>

              <p className="text-sm text-muted-foreground">
                {t('provider.credentialDescription', 'We reserve the right to request verification documents at any time, including for random compliance checks or in response to complaints.')}
              </p>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {isPt ? 'Suas informações são 100% confidenciais' : 'Your information is 100% confidential'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isPt
                      ? 'Documentos são criptografados, nunca compartilhados com terceiros e usados exclusivamente para fins de verificação. Uma vez verificados, você receberá um selo de Credenciais Verificadas no seu perfil.'
                      : 'Documents are encrypted, never shared with third parties, and used solely for verification purposes. Once verified, you will receive a Verified Credentials badge on your profile.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="credential_certification"
                  {...form.register('credential_certification')}
                  className="mt-1 h-4 w-4 rounded border-border"
                  required
                />
                <label htmlFor="credential_certification" className="text-sm text-foreground">
                  {t('provider.credentialCertify', 'I certify that all information provided is accurate and truthful. I can provide supporting documentation (certificates, diplomas, degrees, licenses, awards, and/or certifications) upon request to verify my qualifications.')}
                  <span className="text-destructive"> *</span>
                </label>
              </div>
              {form.formState.errors.credential_certification && (
                <p className="text-sm text-destructive">
                  {t('provider.credentialRequired', 'You must certify your credentials to continue.')}
                </p>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t('provider.uploadCredentials', 'Upload Credentials (optional)')}
                </label>
                <p className="text-xs text-muted-foreground">
                  {t('provider.uploadDescription', 'Upload certificates, diplomas, licenses, or other credentials. Accepted formats: PDF, JPG, PNG (max 10MB each).')}
                </p>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  onChange={(e) => form.setValue('credential_documents', e.target.files)}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
              </div>
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