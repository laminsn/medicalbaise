import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useSeekerSubscription } from '@/hooks/useSeekerSubscription';
import { LIFESTYLE_TRANSACTION_LIMIT, SEEKER_PLANS, type SeekerPlan } from '@/lib/constants/seekerPlans';
import { formatDisplayPrice } from '@/lib/currency';
import { useDisplayCurrency } from '@/contexts/DisplayCurrencyContext';
import { DisplayRateNote } from '@/components/pricing/DisplayRateNote';
import '@/styles/baise-plan-cards.css';

const PLANS = [
  {
    id: 'flex' as const,
    dataPlan: 'Flex',
    monthlyBrl: SEEKER_PLANS.flex.monthlyBrl,
    pillKey: 'seekerPricing.defaultPill' as const,
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
    monthlyBrl: SEEKER_PLANS.lifestyle.monthlyBrl,
    pillKey: 'seekerPricing.bestForRepeat' as const,
    featured: true,
    featureKeys: [
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
    monthlyBrl: SEEKER_PLANS.project.monthlyBrl,
    pillKey: null,
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

type SeekerPlanCardsProps = {
  nested?: boolean;
};

export function SeekerPlanCards({ nested = false }: SeekerPlanCardsProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isPt = i18n.resolvedLanguage?.startsWith('pt') || i18n.language.startsWith('pt');
  const isEs = i18n.resolvedLanguage?.startsWith('es') || i18n.language.startsWith('es');
  const { plan: currentPlan, transactionsUsed, startCheckout } = useSeekerSubscription();
  const { currency } = useDisplayCurrency();
  const [upgrading, setUpgrading] = useState<SeekerPlan | null>(null);

  const handleSelectPlan = async (planId: SeekerPlan) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (planId === 'flex' || planId === currentPlan) return;
    if (planId !== 'lifestyle' && planId !== 'project') return;

    setUpgrading(planId);
    try {
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
    <div className={`seeker-pricing-source ${nested ? 'nested' : ''}`}>
      <section className="pricing-seeker" aria-labelledby="seeker-pricing" data-display-currency={currency}>
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
            const features = plan.featureKeys.map((feature) => t(`seekerPricing.features.${feature}`));
            const lifestyleUsed = currentPlan === 'lifestyle' ? transactionsUsed : 0;
            const feeCallout =
              plan.id === 'flex'
                ? {
                    strong: `${SEEKER_PLANS.flex.feePercent}%`,
                    label: t('seekerPricing.feeMin', {
                      min: formatDisplayPrice(SEEKER_PLANS.flex.feeMinBrl),
                    }),
                  }
                : plan.id === 'lifestyle'
                  ? {
                      strong: t('seekerPricing.usedCount', {
                        used: lifestyleUsed,
                        limit: LIFESTYLE_TRANSACTION_LIMIT,
                      }),
                      label: t('seekerPricing.usedCountLabel'),
                    }
                  : { strong: t('seekerPricing.unlimited'), label: t('seekerPricing.unlimitedFee') };

            return (
              <article
                key={plan.id}
                className={`plan-card ${plan.featured ? 'featured' : ''}`}
                data-plan={plan.dataPlan}
                data-slug={plan.id}
              >
                <div className="plan-card-top">
                  <div>
                    <span>{t(`seekerPricing.plans.${plan.id}.name`)}</span>
                    <strong>
                      {formatDisplayPrice(plan.monthlyBrl)}
                      <small>{t('seekerPricing.perMonth')}</small>
                    </strong>
                  </div>
                  {plan.pillKey && <b>{t(plan.pillKey)}</b>}
                </div>
                <p>{t(`seekerPricing.plans.${plan.id}.description`)}</p>
                <div className="fee-callout">
                  <strong>{feeCallout.strong}</strong>
                  <span>{feeCallout.label}</span>
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
        <DisplayRateNote className="seeker-pricing-footnote" />
        <p className="seeker-pricing-footnote">{t('seekerPricing.cancelAnytime')}</p>
      </section>
    </div>
  );
}
