import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, MapPin, DollarSign, X, Image } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { SERVICE_CATEGORIES, BUDGET_RANGES } from '@/lib/constants';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function PostJob() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    budgetRange: '',
    urgency: 'flexible',
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const URGENCY_LEVELS = [
    { id: 'emergency', label: t('urgency.emergency'), description: t('urgency.emergencyDesc') },
    { id: 'asap', label: t('urgency.asap'), description: t('urgency.asapDesc') },
    { id: 'flexible', label: t('urgency.flexible'), description: t('urgency.flexibleDesc') },
    { id: 'scheduled', label: t('urgency.scheduled'), description: t('urgency.scheduledDesc') },
  ];

  // Redirect if not logged in
  if (!user) {
    return (
      <AppLayout showNav={false}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Camera className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{t('auth.loginToPost')}</h2>
          <p className="text-muted-foreground mb-6">
            {t('auth.loginRequired')}
          </p>
          <Button onClick={() => navigate('/auth')}>
            {t('auth.login')}
          </Button>
        </div>
      </AppLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.category) {
      toast.error(t('postJob.fillTitleDescCategory'));
      return;
    }

    setLoading(true);
    
    try {
      // Parse budget range
      const budgetInfo = BUDGET_RANGES.find(r => r.label === formData.budgetRange);
      
      // Fetch category_id from database
      const { data: categoryData } = await supabase
        .from('service_categories')
        .select('id')
        .or(`name_en.eq.${SERVICE_CATEGORIES.find(c => c.id === formData.category)?.name_en},name_pt.eq.${SERVICE_CATEGORIES.find(c => c.id === formData.category)?.name_pt}`)
        .maybeSingle();

      // Insert job
      const { data: jobData, error: jobError } = await supabase
        .from('jobs_posted')
        .insert({
          customer_id: user.id,
          title: formData.title,
          description: formData.description,
          category_id: categoryData?.id || null,
          location_address: formData.location || null,
          budget_min: budgetInfo?.min || null,
          budget_max: budgetInfo?.max || null,
          budget_disclosed: formData.budgetRange !== 'open' && formData.budgetRange !== '',
          urgency: formData.urgency as any,
          is_urgent: formData.urgency === 'emergency' || formData.urgency === 'asap',
          status: 'accepting_bids',
        })
        .select()
        .single();

      if (jobError) throw jobError;

      toast.success(t('postJob.jobPublished'));
      navigate('/my-jobs');
    } catch (error) {
      console.error('Error posting job:', error);
      toast.error(t('postJob.errorPosting'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout showNav={false}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/my-jobs')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">{t('postJob.title')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">{t('postJob.jobTitle')} *</Label>
          <Input
            id="title"
            placeholder={t('postJob.jobTitlePlaceholder')}
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground">{formData.title.length}/100</p>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label>{t('postJob.category')} *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('postJob.selectCategory')} />
            </SelectTrigger>
            <SelectContent>
              {SERVICE_CATEGORIES.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {i18n.language === 'pt' ? cat.name_pt : cat.name_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">{t('postJob.description')} *</Label>
          <Textarea
            id="description"
            placeholder={t('postJob.descriptionPlaceholder')}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={5}
            maxLength={2000}
          />
          <p className="text-xs text-muted-foreground">{formData.description.length}/2000</p>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">{t('postJob.location')}</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="location"
              placeholder={t('postJob.locationPlaceholder')}
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        {/* Budget */}
        <div className="space-y-2">
          <Label>{t('postJob.estimatedBudget')}</Label>
          <Select
            value={formData.budgetRange}
            onValueChange={(value) => setFormData({ ...formData, budgetRange: value })}
          >
            <SelectTrigger>
              <DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder={t('postJob.selectRange')} />
            </SelectTrigger>
            <SelectContent>
              {BUDGET_RANGES.map((range) => (
                <SelectItem key={range.label} value={range.label}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Urgency */}
        <div className="space-y-3">
          <Label>{t('postJob.urgency')}</Label>
          <RadioGroup
            value={formData.urgency}
            onValueChange={(value) => setFormData({ ...formData, urgency: value })}
            className="space-y-2"
          >
            {URGENCY_LEVELS.map((level) => (
              <div
                key={level.id}
                className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <RadioGroupItem value={level.id} id={level.id} />
                <div className="flex-1">
                  <Label htmlFor={level.id} className="font-medium cursor-pointer">
                    {level.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{level.description}</p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Photos */}
        <div className="space-y-2">
          <Label>{t('postJob.photos')}</Label>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (photos.length + files.length > 5) {
                toast.error(t('postJob.maxPhotos'));
                return;
              }
              const newPhotos = [...photos, ...files].slice(0, 5);
              setPhotos(newPhotos);
              
              // Generate previews
              const newPreviews = newPhotos.map(file => URL.createObjectURL(file));
              setPhotoPreviews(prev => {
                prev.forEach(url => URL.revokeObjectURL(url));
                return newPreviews;
              });
            }}
          />
          
          {photoPreviews.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {photoPreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                  <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(preview);
                      setPhotos(prev => prev.filter((_, i) => i !== index));
                      setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
                    }}
                    className="absolute top-1 right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center hover:border-primary/50 transition-colors"
                >
                  <Image className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">+</span>
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors"
            >
              <Camera className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {t('postJob.tapToAddPhotos')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('postJob.maxPhotos')}
              </p>
            </button>
          )}
        </div>

        {/* Submit */}
        <div className="pt-4 safe-bottom">
          <Button
            type="submit"
            className="w-full h-12 bg-primary hover:bg-primary/90 font-semibold"
            disabled={loading}
          >
            {loading ? t('postJob.publishing') : t('postJob.publishJob')}
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-3">
            {t('postJob.freePosting')}
          </p>
        </div>
      </form>
    </AppLayout>
  );
}
