import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, Loader2, RefreshCcw, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getBaiseAppKey, getLocaleKey } from '@/lib/providerCommunication';
import { useDisplayCurrency } from '@/contexts/DisplayCurrencyContext';
import { formatDisplayPrice } from '@/lib/currency';
import {
  INSIGHT_REVENUE_HIGH_BRL,
  INSIGHT_REVENUE_MID_BRL,
  INSIGHT_REVENUE_UNDER_BRL,
} from '@/lib/constants/displayAmounts';

const db = supabase as any;

type ClientInsightProfile = {
  id: string;
  occupation: string | null;
  revenue_range: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  region: string | null;
  lifestyle_tags: string[] | null;
  family_size: number | null;
  life_goals: unknown;
  education_level: string | null;
  confidence_score: number;
  last_surveyed_at: string | null;
  next_survey_due_at: string | null;
};

const surveyCopy = {
  en: {
    title: 'Help Baise recommend what actually fits',
    description: 'A few optional details help us suggest services that add real value to your life, work, records, and goals.',
    savedTitle: 'Your fit profile is saved',
    savedDescription: 'We use this to keep add-ons and reminders relevant instead of noisy.',
    update: 'Update profile',
    occupation: 'Occupation',
    occupationPlaceholder: 'Attorney, founder, parent, designer...',
    revenue: 'Revenue or income range',
    country: 'Country',
    state: 'State or region',
    city: 'City',
    lifestyle: 'Lifestyle notes',
    familySize: 'Household size',
    lifeGoals: 'Life or business goals',
    lifeGoalsPlaceholder: 'Protect my family, organize records, grow my business...',
    education: 'Education level',
    submit: 'Save insight profile',
    saving: 'Saving',
    confidence: 'fit context',
    nextReview: 'Next review',
    hide: 'Not now',
  },
  pt: {
    title: 'Ajude a Baise a recomendar o que faz sentido',
    description: 'Alguns detalhes opcionais ajudam a sugerir servicos que agregam valor real para sua vida, trabalho, registros e objetivos.',
    savedTitle: 'Seu perfil de adequacao esta salvo',
    savedDescription: 'Usamos isso para manter complementos e lembretes relevantes, sem excesso.',
    update: 'Atualizar perfil',
    occupation: 'Ocupacao',
    occupationPlaceholder: 'Advogado, fundador, responsavel pela familia, designer...',
    revenue: 'Faixa de renda ou faturamento',
    country: 'Pais',
    state: 'Estado ou regiao',
    city: 'Cidade',
    lifestyle: 'Notas de estilo de vida',
    familySize: 'Tamanho da casa',
    lifeGoals: 'Objetivos de vida ou negocio',
    lifeGoalsPlaceholder: 'Proteger minha familia, organizar registros, crescer meu negocio...',
    education: 'Escolaridade',
    submit: 'Salvar perfil',
    saving: 'Salvando',
    confidence: 'contexto de ajuste',
    nextReview: 'Proxima revisao',
    hide: 'Agora nao',
  },
  es: {
    title: 'Ayuda a Baise a recomendar lo que encaja',
    description: 'Algunos detalles opcionales ayudan a sugerir servicios que agregan valor real a tu vida, trabajo, registros y metas.',
    savedTitle: 'Tu perfil de ajuste esta guardado',
    savedDescription: 'Usamos esto para mantener complementos y recordatorios relevantes, no ruidosos.',
    update: 'Actualizar perfil',
    occupation: 'Ocupacion',
    occupationPlaceholder: 'Abogado, fundador, cuidador familiar, disenador...',
    revenue: 'Rango de ingresos',
    country: 'Pais',
    state: 'Estado o region',
    city: 'Ciudad',
    lifestyle: 'Notas de estilo de vida',
    familySize: 'Tamano del hogar',
    lifeGoals: 'Metas de vida o negocio',
    lifeGoalsPlaceholder: 'Proteger mi familia, organizar registros, crecer mi negocio...',
    education: 'Nivel educativo',
    submit: 'Guardar perfil',
    saving: 'Guardando',
    confidence: 'contexto de ajuste',
    nextReview: 'Proxima revision',
    hide: 'Ahora no',
  },
};

const REVENUE_OPTION_IDS = ['prefer_not', 'under_5000', '5000_15000', '15000_40000', '40000_plus', 'varies'] as const;

const LEGACY_REVENUE_TO_ID: Record<string, string> = {
  'Prefer not to say': 'prefer_not',
  'Under R$5k/month': 'under_5000',
  'R$5k-R$15k/month': '5000_15000',
  'R$15k-R$40k/month': '15000_40000',
  'R$40k+/month': '40000_plus',
  'Business revenue varies': 'varies',
  'Prefiro nao informar': 'prefer_not',
  'Abaixo de R$5 mil/mes': 'under_5000',
  'R$5 mil-R$15 mil/mes': '5000_15000',
  'R$15 mil-R$40 mil/mes': '15000_40000',
  'R$40 mil+/mes': '40000_plus',
  'Faturamento varia': 'varies',
  'Prefiero no decir': 'prefer_not',
  'Menos de R$5 mil/mes': 'under_5000',
  'Ingresos variables': 'varies',
};

function revenueOptionLabels(
  locale: 'en' | 'pt' | 'es',
  under: string,
  mid: string,
  high: string,
): Record<(typeof REVENUE_OPTION_IDS)[number], string> {
  if (locale === 'pt') {
    return {
      prefer_not: 'Prefiro nao informar',
      under_5000: `Abaixo de ${under}/mes`,
      '5000_15000': `${under}-${mid}/mes`,
      '15000_40000': `${mid}-${high}/mes`,
      '40000_plus': `${high}+/mes`,
      varies: 'Faturamento varia',
    };
  }
  if (locale === 'es') {
    return {
      prefer_not: 'Prefiero no decir',
      under_5000: `Menos de ${under}/mes`,
      '5000_15000': `${under}-${mid}/mes`,
      '15000_40000': `${mid}-${high}/mes`,
      '40000_plus': `${high}+/mes`,
      varies: 'Ingresos variables',
    };
  }
  return {
    prefer_not: 'Prefer not to say',
    under_5000: `Under ${under}/month`,
    '5000_15000': `${under}-${mid}/month`,
    '15000_40000': `${mid}-${high}/month`,
    '40000_plus': `${high}+/month`,
    varies: 'Business revenue varies',
  };
}

function normalizeRevenueId(value?: string | null): string {
  if (!value) return '';
  if ((REVENUE_OPTION_IDS as readonly string[]).includes(value)) return value;
  return LEGACY_REVENUE_TO_ID[value] || value;
}

const lifestyleOptions = {
  en: ['Busy professional', 'Business owner', 'Family organizer', 'Frequent traveler', 'New to Brazil', 'Planning a major change'],
  pt: ['Profissional ocupado', 'Dono de negocio', 'Organizador da familia', 'Viajante frequente', 'Novo no Brasil', 'Planejando uma grande mudanca'],
  es: ['Profesional ocupado', 'Dueno de negocio', 'Organizador familiar', 'Viajero frecuente', 'Nuevo en Brasil', 'Planeando un cambio importante'],
};

const educationOptions = {
  en: ['Prefer not to say', 'High school', 'Technical or vocational', 'Bachelor degree', 'Graduate degree', 'Doctorate or professional degree'],
  pt: ['Prefiro nao informar', 'Ensino medio', 'Tecnico ou profissionalizante', 'Graduacao', 'Pos-graduacao', 'Doutorado ou grau profissional'],
  es: ['Prefiero no decir', 'Secundaria', 'Tecnico o vocacional', 'Licenciatura', 'Posgrado', 'Doctorado o grado profesional'],
};

function formatDate(value?: string | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function getGoalText(value: unknown) {
  if (!Array.isArray(value)) return '';
  return value.map((item) => String(item).trim()).filter(Boolean).join(', ');
}

export function ClientInsightSurvey() {
  const { i18n } = useTranslation();
  const { currency, rates } = useDisplayCurrency();
  const { user } = useAuth();
  const appKey = getBaiseAppKey();
  const locale = getLocaleKey(i18n.language);
  const copy = surveyCopy[locale];
  const under = formatDisplayPrice(INSIGHT_REVENUE_UNDER_BRL, { currency, rates });
  const mid = formatDisplayPrice(INSIGHT_REVENUE_MID_BRL, { currency, rates });
  const high = formatDisplayPrice(INSIGHT_REVENUE_HIGH_BRL, { currency, rates });
  const revenueLabels = revenueOptionLabels(locale, under, mid, high);
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [occupation, setOccupation] = useState('');
  const [revenueRange, setRevenueRange] = useState('');
  const [country, setCountry] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [city, setCity] = useState('');
  const [selectedLifestyle, setSelectedLifestyle] = useState<string[]>([]);
  const [familySize, setFamilySize] = useState('');
  const [lifeGoals, setLifeGoals] = useState('');
  const [educationLevel, setEducationLevel] = useState('');

  const profileQuery = useQuery({
    queryKey: ['client-insight-profile', appKey, user?.id],
    enabled: Boolean(user?.id),
    retry: false,
    queryFn: async () => {
      const { data, error } = await db
        .from('client_insight_profiles')
        .select('id, occupation, revenue_range, city, state, country, region, lifestyle_tags, family_size, life_goals, education_level, confidence_score, last_surveyed_at, next_survey_due_at')
        .eq('app_key', appKey)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      return data as ClientInsightProfile | null;
    },
  });

  const profile = profileQuery.data || null;
  const isDue = Boolean(profile?.next_survey_due_at && new Date(profile.next_survey_due_at).getTime() <= Date.now());
  const formOpen = !profile || isDue || showForm;

  useEffect(() => {
    if (!profile) return;
    setOccupation(profile.occupation || '');
    setRevenueRange(normalizeRevenueId(profile.revenue_range));
    setCountry(profile.country || '');
    setStateRegion(profile.state || profile.region || '');
    setCity(profile.city || '');
    setSelectedLifestyle(profile.lifestyle_tags || []);
    setFamilySize(profile.family_size != null ? String(profile.family_size) : '');
    setLifeGoals(getGoalText(profile.life_goals));
    setEducationLevel(profile.education_level || '');
  }, [profile]);

  const savedBadges = useMemo(() => {
    if (!profile) return [];
    const revenueId = normalizeRevenueId(profile.revenue_range);
    const revenueLabel = revenueLabels[revenueId as keyof typeof revenueLabels] || profile.revenue_range;
    return [
      profile.occupation,
      revenueLabel,
      [profile.city, profile.state || profile.region, profile.country].filter(Boolean).join(', '),
      ...(profile.lifestyle_tags || []).slice(0, 2),
      getGoalText(profile.life_goals),
    ].filter(Boolean).slice(0, 4) as string[];
  }, [profile, revenueLabels]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const responses = {
        occupation: occupation.trim(),
        revenue_range: revenueRange,
        country: country.trim(),
        state: stateRegion.trim(),
        city: city.trim(),
        region: stateRegion.trim() || city.trim() || country.trim(),
        lifestyle_tags: selectedLifestyle,
        family_size: familySize,
        life_goals: lifeGoals
          .split(/[\n,]/)
          .map((item) => item.trim())
          .filter(Boolean),
        education_level: educationLevel,
      };

      const { data: profileId, error } = await db.rpc('upsert_client_insight_profile', {
        target_app_key: appKey,
        target_responses: responses,
        target_survey_stage: profile ? 'manual_update' : 'intake',
        target_locale: locale,
      });
      if (error) throw error;

      const locationPayload = {
        country: country.trim() || null,
        state: stateRegion.trim() || null,
        city: city.trim() || null,
        region: stateRegion.trim() || city.trim() || country.trim() || null,
      };

      if (profileId && Object.values(locationPayload).some(Boolean)) {
        const { error: locationError } = await db
          .from('client_insight_profiles')
          .update(locationPayload)
          .eq('id', profileId);
        if (locationError) throw locationError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-insight-profile', appKey, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['client-product-addons', appKey, user?.id] });
      setShowForm(false);
      toast.success('Insight profile saved');
    },
    onError: (error: Error) => toast.error(error.message || 'Unable to save insight profile'),
  });

  const toggleLifestyle = (item: string) => {
    setSelectedLifestyle((current) => (
      current.includes(item)
        ? current.filter((value) => value !== item)
        : [...current, item]
    ));
  };

  if (!user || profileQuery.isError) return null;

  if (profileQuery.isLoading) {
    return (
      <Card>
        <CardContent className="flex min-h-28 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!formOpen && profile) {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                {copy.savedTitle}
              </CardTitle>
              <CardDescription>{copy.savedDescription}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{profile.confidence_score}% {copy.confidence}</Badge>
              {profile.next_survey_due_at ? <Badge variant="outline">{copy.nextReview}: {formatDate(profile.next_survey_due_at)}</Badge> : null}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {savedBadges.length ? savedBadges.map((badge) => (
                <Badge key={badge} variant="outline">{badge}</Badge>
              )) : <p className="text-sm text-muted-foreground">{copy.description}</p>}
            </div>
            <Button type="button" variant="outline" className="gap-2" onClick={() => setShowForm(true)}>
              <RefreshCcw className="h-4 w-4" />
              {copy.update}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {copy.title}
        </CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="client-insight-occupation">{copy.occupation}</Label>
            <Input
              id="client-insight-occupation"
              value={occupation}
              placeholder={profile?.occupation || copy.occupationPlaceholder}
              onChange={(event) => setOccupation(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>{copy.revenue}</Label>
            <Select value={revenueRange} onValueChange={setRevenueRange}>
              <SelectTrigger>
                <SelectValue placeholder={revenueLabels[normalizeRevenueId(profile?.revenue_range) as keyof typeof revenueLabels] || copy.revenue} />
              </SelectTrigger>
              <SelectContent>
                {REVENUE_OPTION_IDS.map((optionId) => (
                  <SelectItem key={optionId} value={optionId}>{revenueLabels[optionId]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-insight-family">{copy.familySize}</Label>
            <Input
              id="client-insight-family"
              type="number"
              min="0"
              value={familySize}
              placeholder={profile?.family_size != null ? String(profile.family_size) : '0'}
              onChange={(event) => setFamilySize(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>{copy.education}</Label>
            <Select value={educationLevel} onValueChange={setEducationLevel}>
              <SelectTrigger>
                <SelectValue placeholder={profile?.education_level || copy.education} />
              </SelectTrigger>
              <SelectContent>
                {educationOptions[locale].map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-insight-country">{copy.country}</Label>
            <Input
              id="client-insight-country"
              value={country}
              placeholder={profile?.country || 'Brazil'}
              onChange={(event) => setCountry(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-insight-state">{copy.state}</Label>
            <Input
              id="client-insight-state"
              value={stateRegion}
              placeholder={profile?.state || profile?.region || 'Sao Paulo'}
              onChange={(event) => setStateRegion(event.target.value)}
            />
          </div>

          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="client-insight-city">{copy.city}</Label>
            <Input
              id="client-insight-city"
              value={city}
              placeholder={profile?.city || 'Sao Paulo'}
              onChange={(event) => setCity(event.target.value)}
            />
          </div>

          <div className="space-y-3 lg:col-span-2">
            <Label>{copy.lifestyle}</Label>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {lifestyleOptions[locale].map((option) => (
                <label key={option} className="flex items-center gap-2 rounded-md border p-3 text-sm">
                  <Checkbox checked={selectedLifestyle.includes(option)} onCheckedChange={() => toggleLifestyle(option)} />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="client-insight-goals">{copy.lifeGoals}</Label>
            <Textarea
              id="client-insight-goals"
              value={lifeGoals}
              placeholder={getGoalText(profile?.life_goals) || copy.lifeGoalsPlaceholder}
              onChange={(event) => setLifeGoals(event.target.value)}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          {profile ? (
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              {copy.hide}
            </Button>
          ) : null}
          <Button type="button" className="gap-2" disabled={submitMutation.isPending} onClick={() => submitMutation.mutate()}>
            {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {submitMutation.isPending ? copy.saving : copy.submit}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
