import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSeekerSubscription } from '@/hooks/useSeekerSubscription';
import { LIFESTYLE_TRANSACTION_LIMIT, type SeekerPlan } from '@/lib/constants/seekerPlans';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import '@/styles/baise-plan-cards.css';

const PLANS = [
  {
    id: 'flex' as const,
    dataPlan: 'Flex',
    monthly: 'R$0',
    bookingFee: '5%',
    bookingLabelKey: 'seekerPricing.feeMin',
    featured: false,
    featureKeys: [
      'noBrowseFee',
      'compareProfiles',
      'completedReviews',
      'scheduleMessage',
      'quotesTogether',
      'paymentTrail',
      'escalationPaths',
      'representativeReview',
      'processingSeparate',
      'feeAfterComplete',
      'noMonthlyCommitment',
    ],
  },
  {
    id: 'lifestyle' as const,
    dataPlan: 'Lifestyle',
    monthly: 'R$99',
    bookingFee: '0%',
    bookingLabelKey: 'seekerPricing.eightTx',
    featured: true,
    featureKeys: [
      'usedOfLimit',
      'everythingInFlex',
      'noBookingFee',
      'processingIncluded',
      'prioritySupport',
      'predictableCosts',
      'trustSignals',
      'scheduleMessage',
      'invoicesTogether',
      'escalationPaths',
      'representativeWhenNeeded',
      'repeatContext',
    ],
  },
  {
    id: 'project' as const,
    dataPlan: 'Project',
    monthly: 'R$499',
    bookingFee: '0%',
    bookingLabelKey: 'seekerPricing.unlimitedFee',
    featured: false,
    featureKeys: [
      'everythingInLifestyle',
      'unlimitedServices',
      'noBookingFee',
      'processingIncluded',
      'prioritySupport',
      'predictableCosts',
      'trustSignals',
      'scheduleMessage',
      'invoicesTogether',
      'escalationPaths',
      'representativeWhenNeeded',
    ],
  },
];

export default function SeekerPricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isPt = i18n.resolvedLanguage?.startsWith('pt') || i18n.language.startsWith('pt');
  const isEs = i18n.resolvedLanguage?.startsWith('es') || i18n.language.startsWith('es');
  const { plan: currentPlan, transactionCount, startCheckout } = useSeekerSubscription();
  const [upgrading, setUpgrading] = useState<SeekerPlan | null>(null);

  const handleSelectPlan = async (planId: SeekerPlan) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (planId === 'flex' || planId === currentPlan) return;

    setUpgrading(planId);
    try {
      if (planId !== 'lifestyle' && planId !== 'project') return;
      await startCheckout(planId);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : isPt
            ? 'Falha ao iniciar checkout'
            : isEs
              ? 'Error al iniciar el pago'
              : 'Failed to start checkout',
      );
    } finally {
      setUpgrading(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('seekerPricing.title')} - Brasil Base</title>
        <meta name="description" content={t('seekerPricing.subtitle')} />
      </Helmet>
      <AppLayout showNav={false}>
        <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/customer-dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">{t('seekerPricing.title')}</h1>
        </div>

        <div className="seeker-pricing-source px-3 pb-24">
          <section className="pricing-seeker" aria-labelledby="seeker-pricing">
            <div className="pricing-section-heading">
              <div>
                <p className="eyebrow">{t('seekerPricing.eyebrow')}</p>
                <h2 id="seeker-pricing">{t('seekerPricing.heading')}</h2>
              </div>
              <p>{t('seekerPricing.intro')}</p>
            </div>

            <div className="seeker-pricing-grid">
              {PLANS.map((plan) => {
                const isCurrentPlan = plan.id === currentPlan;
                const features = plan.featureKeys.map((feature) =>
                  feature === 'usedOfLimit'
                    ? t('seekerPricing.usedOfLimit', {
                        used: currentPlan === 'lifestyle' ? transactionCount : 0,
                        limit: LIFESTYLE_TRANSACTION_LIMIT,
                      })
                    : t(`seekerPricing.features.${feature}`),
                );

                return (
                  <article
                    key={plan.id}
                    className={`plan-card ${plan.featured ? 'featured' : ''}`}
                    data-plan={plan.dataPlan}
                  >
                    <div className="plan-card-top">
                      <div>
                        <span>{t(`seekerPricing.plans.${plan.id}.name`)}</span>
                        <strong>
                          {plan.monthly}
                          <small>{t('seekerPricing.perMonth')}</small>
                        </strong>
                      </div>
                      {plan.featured && <b>{t('seekerPricing.bestForRepeat')}</b>}
                    </div>
                    <p>{t(`seekerPricing.plans.${plan.id}.description`)}</p>
                    <div className="fee-callout">
                      <strong>{plan.bookingFee}</strong>
                      <span>{t(plan.bookingLabelKey)}</span>
                    </div>
                    <div className="plan-benefit-count">
                      <span>{t('seekerPricing.includedBenefits')}</span>
                      <b>{features.length}</b>
                    </div>
                    <ul>
                      {features.map((feature) => (
                        <li key={feature}>
                          <Check />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    {plan.id !== 'flex' && (
                      <button
                        type="button"
                        className="button button-dark"
                        disabled={isCurrentPlan || upgrading !== null}
                        onClick={() => handleSelectPlan(plan.id)}
                      >
                        {upgrading === plan.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {isPt ? 'Abrindo checkout...' : isEs ? 'Abriendo pago...' : 'Opening checkout...'}
                          </>
                        ) : isCurrentPlan ? (
                          t('seekerPricing.currentPlan')
                        ) : (
                          t('seekerPricing.selectPlan')
                        )}
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </AppLayout>
    </>
  );
}
