import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Camera, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProviderServicesEditor } from '@/components/provider/ProviderServicesEditor';
import { WarrantyGuaranteeEditor } from '@/components/provider/WarrantyGuaranteeEditor';
import { LanguageFluencySelector } from '@/components/LanguageFluencySelector';

export default function ProfileEdit() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    profile?.languages || ['portuguese']
  );
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    phone: profile?.phone || '',
    city: profile?.city || '',
    state: profile?.state || '',
    status: (profile as any)?.status || '',
    bio: (profile as any)?.bio || '',
    avatar_url: profile?.avatar_url || '',
    // Address fields
    address_cep: (profile as any)?.address_cep || '',
    address_street: (profile as any)?.address_street || '',
    address_number: (profile as any)?.address_number || '',
    address_complement: (profile as any)?.address_complement || '',
    address_neighborhood: (profile as any)?.address_neighborhood || '',
  });

  if (!user) {
    navigate('/auth');
    return null;
  }

  const initials = profile 
    ? `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() 
    : 'U';

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image under 5MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to avatars bucket (we'll create it if needed)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        // If bucket doesn't exist, show a message
        if (uploadError.message.includes('not found')) {
          throw new Error('Avatar storage not configured. Please contact support.');
        }
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      
      toast({
        title: 'Image uploaded',
        description: 'Your profile picture has been updated',
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          phone: formData.phone.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          status: formData.status.trim() || null,
          bio: formData.bio.trim() || null,
          avatar_url: formData.avatar_url || null,
          languages: selectedLanguages,
          // Address fields
          address_cep: formData.address_cep.trim() || null,
          address_street: formData.address_street.trim() || null,
          address_number: formData.address_number.trim() || null,
          address_complement: formData.address_complement.trim() || null,
          address_neighborhood: formData.address_neighborhood.trim() || null,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      await refreshProfile();
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been saved successfully',
      });
      
      navigate('/profile');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('profile.editProfile')} - Brasil Base</title>
      </Helmet>
      <AppLayout>
        <div className="px-4 py-6 pb-24 max-w-lg mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">{t('profile.editProfile')}</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('profile.profilePicture', 'Profile Picture')}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={formData.avatar_url} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <p className="text-sm text-muted-foreground text-center">
                  {t('profile.clickToUpload', 'Click the camera icon to upload a new photo')}
                </p>
              </CardContent>
            </Card>

            {/* Status & Bio */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('profile.aboutYou', 'About You')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">{t('profile.status', 'Status')}</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('profile.selectStatus', 'Select your status')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Available">{t('profile.statusAvailable', 'Available')}</SelectItem>
                      <SelectItem value="Busy">{t('profile.statusBusy', 'Busy')}</SelectItem>
                      <SelectItem value="On Vacation">{t('profile.statusVacation', 'On Vacation')}</SelectItem>
                      <SelectItem value="Invested!">{t('profile.statusInvested', 'Invested!')}</SelectItem>
                      <SelectItem value="Open to Work">{t('profile.statusOpenToWork', 'Open to Work')}</SelectItem>
                      <SelectItem value="Hiring">{t('profile.statusHiring', 'Hiring')}</SelectItem>
                      <SelectItem value="Learning">{t('profile.statusLearning', 'Learning')}</SelectItem>
                      <SelectItem value="Building">{t('profile.statusBuilding', 'Building')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">{t('profile.bio', 'Bio')}</Label>
                  <Textarea
                    id="bio"
                    placeholder={t('profile.bioPlaceholder', 'Tell us about yourself...')}
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    maxLength={500}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">{formData.bio.length}/500</p>
                </div>
              </CardContent>
            </Card>

            {/* Personal Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('profile.personalInfo', 'Personal Information')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">{t('profile.firstName', 'First Name')}</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">{t('profile.lastName', 'Last Name')}</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t('profile.phone', 'Phone')}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">{t('profile.city', 'City')}</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">{t('profile.state', 'State')}</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('profile.address', 'Address')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t('profile.addressDescription', 'Your address will be used for in-person consultations and home visits.')}
                </p>
                
                <div className="space-y-2">
                  <Label htmlFor="address_cep">{t('profile.cep', 'CEP (Postal Code)')}</Label>
                  <Input
                    id="address_cep"
                    placeholder="00000-000"
                    value={formData.address_cep}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                      const formattedCEP = value.length > 5 
                        ? `${value.slice(0, 5)}-${value.slice(5)}` 
                        : value;
                      setFormData(prev => ({ ...prev, address_cep: formattedCEP }));
                    }}
                    maxLength={9}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address_street">{t('profile.street', 'Street')}</Label>
                  <Input
                    id="address_street"
                    placeholder={t('profile.streetPlaceholder', 'Rua, Avenida, etc.')}
                    value={formData.address_street}
                    onChange={(e) => setFormData(prev => ({ ...prev, address_street: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address_number">{t('profile.number', 'Number')}</Label>
                    <Input
                      id="address_number"
                      placeholder="123"
                      value={formData.address_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, address_number: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address_complement">{t('profile.complement', 'Complement')}</Label>
                    <Input
                      id="address_complement"
                      placeholder={t('profile.complementPlaceholder', 'Apt, Suite, etc.')}
                      value={formData.address_complement}
                      onChange={(e) => setFormData(prev => ({ ...prev, address_complement: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address_neighborhood">{t('profile.neighborhood', 'Neighborhood')}</Label>
                  <Input
                    id="address_neighborhood"
                    placeholder={t('profile.neighborhoodPlaceholder', 'Bairro')}
                    value={formData.address_neighborhood}
                    onChange={(e) => setFormData(prev => ({ ...prev, address_neighborhood: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Language Fluency */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('profile.languageFluency')}</CardTitle>
              </CardHeader>
              <CardContent>
                <LanguageFluencySelector
                  selectedLanguages={selectedLanguages}
                  onLanguagesChange={setSelectedLanguages}
                  description={t('profile.languageFluencyDescription')}
                />
              </CardContent>
            </Card>

            {/* Submit */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.saving', 'Saving...')}
                </>
              ) : (
                t('common.save', 'Save Changes')
              )}
            </Button>
          </form>

          {/* Provider Services Editor - outside form since it saves independently */}
          {profile?.user_type === 'provider' && (
            <div className="mt-6 space-y-6">
              <ProviderServicesEditor />
              <WarrantyGuaranteeEditor />
            </div>
          )}
        </div>
      </AppLayout>
    </>
  );
}
