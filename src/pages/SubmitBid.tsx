import { useState, useEffect } from 'react';
import { formatPrice, getUserCurrency } from '@/lib/currency';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  ArrowLeft,
  DollarSign,
  Send,
  FileText,
  Calendar,
  Wrench,
} from 'lucide-react';
import { BidTemplates } from '@/components/provider/BidTemplates';

export default function SubmitBid() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<any>(null);
  const [job, setJob] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    quotedPrice: '',
    proposalText: '',
    materialsIncluded: false,
    timelineDays: '',
    warrantyDetails: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !id) return;

      // Fetch provider
      const { data: providerData } = await supabase
        .from('providers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!providerData) {
        toast.error(t('jobs.mustBeProvider'));
        navigate('/jobs');
        return;
      }

      if (providerData.subscription_tier === 'free') {
        toast.error(t('jobs.upgradeToSubmitBid'));
        navigate('/pricing');
        return;
      }

      setProvider(providerData);

      // Fetch job
      const { data: jobData } = await supabase
        .from('jobs_posted')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!jobData) {
        toast.error(t('jobs.jobNotFound'));
        navigate('/jobs');
        return;
      }

      setJob(jobData);

      // Check if already bid
      const { data: existingBid } = await supabase
        .from('bids')
        .select('id')
        .eq('job_id', id)
        .eq('provider_id', providerData.id)
        .maybeSingle();

      if (existingBid) {
        toast.error(t('jobs.alreadySubmittedBid'));
        navigate(`/job/${id}`);
        return;
      }
    };

    fetchData();
  }, [user, id, navigate, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.quotedPrice || !formData.proposalText) {
      toast.error(t('jobs.fillRequiredFields'));
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('bids')
        .insert({
          job_id: id,
          provider_id: provider.id,
          quoted_price: parseFloat(formData.quotedPrice),
          proposal_text: formData.proposalText,
          materials_included: formData.materialsIncluded,
          timeline_duration_days: formData.timelineDays ? parseInt(formData.timelineDays) : null,
          warranty_details: formData.warrantyDetails || null,
        });

      if (error) throw error;

      toast.success(t('jobs.bidSubmittedSuccess'));
      navigate(`/job/${id}`);
    } catch (error) {

      toast.error(t('jobs.errorSubmittingBid'));
    } finally {
      setLoading(false);
    }
  };

  if (!job || !provider) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">{t('common.loading')}...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('jobs.submitProposal')} - Brasil Base</title>
      </Helmet>
      <AppLayout>
        <div className="px-4 py-6 pb-24">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{t('jobs.submitProposal')}</h1>
              <p className="text-sm text-muted-foreground">{job.title}</p>
            </div>
          </div>

          {/* Job Summary */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">{job.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {job.description}
              </p>
              {job.budget_disclosed && (job.budget_min || job.budget_max) && (
                <div className="flex items-center gap-1 text-sm text-primary font-medium">
                  <DollarSign className="w-4 h-4" />
                  {job.budget_min && job.budget_max
                    ? `${formatPrice(job.budget_min)} - ${formatPrice(job.budget_max)}`
                    : job.budget_min
                      ? `${formatPrice(job.budget_min)}+`
                      : `${t('jobs.upTo')} ${formatPrice(job.budget_max || 0)}`
                  }
                </div>
              )}
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Price */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  {t('jobs.yourPrice')} *
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{getUserCurrency()}</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.quotedPrice}
                    onChange={(e) => setFormData({ ...formData, quotedPrice: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Proposal */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {t('jobs.yourProposal')} *
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <BidTemplates
                  mode="select"
                  onSelect={(content) => setFormData({ ...formData, proposalText: content })}
                />
                <Textarea
                  placeholder={t('jobs.proposalPlaceholder')}
                  value={formData.proposalText}
                  onChange={(e) => setFormData({ ...formData, proposalText: e.target.value })}
                  rows={5}
                  required
                />
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {t('jobs.estimatedDuration')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.timelineDays}
                    onChange={(e) => setFormData({ ...formData, timelineDays: e.target.value })}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">{t('jobs.days')}</span>
                </div>
              </CardContent>
            </Card>

            {/* Materials & Warranty */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  {t('jobs.additionalDetails')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="materials"
                    checked={formData.materialsIncluded}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, materialsIncluded: checked as boolean })
                    }
                  />
                  <Label htmlFor="materials">{t('jobs.materialsIncluded')}</Label>
                </div>
                
                <div className="space-y-2">
                  <Label>{t('jobs.warranty')}</Label>
                  <Input
                    placeholder={t('jobs.warrantyPlaceholder')}
                    value={formData.warrantyDetails}
                    onChange={(e) => setFormData({ ...formData, warrantyDetails: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>{t('common.loading')}...</>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {t('jobs.submitProposal')}
                </>
              )}
            </Button>
          </form>
        </div>
      </AppLayout>
    </>
  );
}
