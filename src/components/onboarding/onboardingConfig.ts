export type ProviderTourSection = 'today' | 'services' | 'work' | 'money' | 'growth';

export type OnboardingStepKey =
  | 'provider_profile'
  | 'first_service'
  | 'availability_payout'
  | 'public_preview'
  | 'publish_listing';

export interface ChecklistStepConfig {
  key: OnboardingStepKey;
  labelKey: string;
  descriptionKey: string;
  destination: string;
  autoDetect: 'profile' | 'service' | 'published' | 'none';
}

export interface TourStepConfig {
  id: string;
  titleKey: string;
  bodyKey: string;
  selector: string;
  section: ProviderTourSection;
}

export const onboardingConfig = {
  lane: 'provider',
  welcome: {
    outcomeKey: 'onboarding.welcome.outcome',
    destination: '/services/new',
  },
  checklistSteps: [
    { key: 'provider_profile', labelKey: 'onboarding.step.profile', descriptionKey: 'onboarding.step.profileDesc', destination: '/profile/edit', autoDetect: 'profile' },
    { key: 'first_service', labelKey: 'onboarding.step.service', descriptionKey: 'onboarding.step.serviceDesc', destination: '/services/new', autoDetect: 'service' },
    { key: 'availability_payout', labelKey: 'onboarding.step.availabilityPayout', descriptionKey: 'onboarding.step.availabilityPayoutDesc', destination: '/payouts', autoDetect: 'none' },
    { key: 'public_preview', labelKey: 'onboarding.step.preview', descriptionKey: 'onboarding.step.previewDesc', destination: '/profile', autoDetect: 'none' },
    { key: 'publish_listing', labelKey: 'onboarding.step.publish', descriptionKey: 'onboarding.step.publishDesc', destination: '/services', autoDetect: 'published' },
  ] satisfies ChecklistStepConfig[],
  tourSteps: [
    { id: 'dashboard', titleKey: 'onboarding.tour.dashboardTitle', bodyKey: 'onboarding.tour.dashboardBody', selector: '[data-onboarding-target="provider-dashboard"]', section: 'today' },
    { id: 'services', titleKey: 'onboarding.tour.servicesTitle', bodyKey: 'onboarding.tour.servicesBody', selector: '[data-onboarding-target="provider-services"]', section: 'services' },
    { id: 'availability', titleKey: 'onboarding.tour.availabilityTitle', bodyKey: 'onboarding.tour.availabilityBody', selector: '[data-onboarding-target="provider-availability"]', section: 'work' },
    { id: 'payouts', titleKey: 'onboarding.tour.payoutsTitle', bodyKey: 'onboarding.tour.payoutsBody', selector: '[data-onboarding-target="provider-payouts"]', section: 'money' },
    { id: 'analytics', titleKey: 'onboarding.tour.analyticsTitle', bodyKey: 'onboarding.tour.analyticsBody', selector: '[data-onboarding-target="provider-analytics"]', section: 'growth' },
  ] satisfies TourStepConfig[],
} as const;
