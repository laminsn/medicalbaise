import { 
  Heart, Stethoscope, Baby, Bone, Brain, Eye, 
  HeartPulse, Pill, Activity, Apple, Smile, Scan,
  Video, Clock, Shield
} from "lucide-react";

// Medical Specialties
export const SERVICE_CATEGORIES = [
  { id: 'general', name_pt: 'Clínica Geral', name_en: 'General Practice', icon: Stethoscope, color: 'hsl(187 100% 42%)' },
  { id: 'cardiology', name_pt: 'Cardiologia', name_en: 'Cardiology', icon: Heart, color: 'hsl(0 84% 60%)' },
  { id: 'dermatology', name_pt: 'Dermatologia', name_en: 'Dermatology', icon: Scan, color: 'hsl(25 90% 55%)' },
  { id: 'pediatrics', name_pt: 'Pediatria', name_en: 'Pediatrics', icon: Baby, color: 'hsl(200 85% 55%)' },
  { id: 'orthopedics', name_pt: 'Ortopedia', name_en: 'Orthopedics', icon: Bone, color: 'hsl(220 70% 50%)' },
  { id: 'neurology', name_pt: 'Neurologia', name_en: 'Neurology', icon: Brain, color: 'hsl(280 70% 60%)' },
  { id: 'ophthalmology', name_pt: 'Oftalmologia', name_en: 'Ophthalmology', icon: Eye, color: 'hsl(150 70% 45%)' },
  { id: 'psychiatry', name_pt: 'Psiquiatria', name_en: 'Psychiatry', icon: HeartPulse, color: 'hsl(320 70% 55%)' },
  { id: 'gynecology', name_pt: 'Ginecologia', name_en: 'Gynecology', icon: Heart, color: 'hsl(340 80% 60%)' },
  { id: 'dentistry', name_pt: 'Odontologia', name_en: 'Dentistry', icon: Smile, color: 'hsl(45 90% 50%)' },
  { id: 'physiotherapy', name_pt: 'Fisioterapia', name_en: 'Physical Therapy', icon: Activity, color: 'hsl(120 60% 45%)' },
  { id: 'nutrition', name_pt: 'Nutrição', name_en: 'Nutrition', icon: Apple, color: 'hsl(100 70% 45%)' },
  { id: 'psychology', name_pt: 'Psicologia', name_en: 'Psychology', icon: Brain, color: 'hsl(260 60% 55%)' },
  { id: 'endocrinology', name_pt: 'Endocrinologia', name_en: 'Endocrinology', icon: Pill, color: 'hsl(30 80% 50%)' },
] as const;

// Popular specialties for homepage
export const POPULAR_SPECIALTIES = [
  'general', 'cardiology', 'dermatology', 'pediatrics', 'orthopedics',
  'dentistry', 'psychology', 'nutrition', 'ophthalmology', 'gynecology'
];

export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Basic',
    price: 0,
    canBid: false,
    portfolioPhotos: 5,
    portfolioVideos: 0,
    transactionFee: 7,
    features: [
      'Professional profile',
      'Appear in search results',
      'Receive direct appointment requests',
      'Up to 5 portfolio photos',
    ],
  },
  pro: {
    name: 'Pro',
    price: 149,
    canBid: true,
    bidsPerMonth: 20,
    maxBidAmount: 5000,
    portfolioPhotos: 20,
    portfolioVideos: 3,
    transactionFee: 5,
    features: [
      'Everything in Basic',
      'Accept appointment requests',
      'Up to 20 requests/month',
      'Up to 20 photos + 3 videos',
      'Calendar management',
      'Teleconsultation support',
    ],
  },
  elite: {
    name: 'Elite',
    price: 299,
    canBid: true,
    bidsPerMonth: -1,
    maxBidAmount: -1,
    portfolioPhotos: 50,
    portfolioVideos: 10,
    transactionFee: 4,
    features: [
      'Everything in Pro',
      'Unlimited appointment requests',
      'Featured in search results',
      'Elite badge on profile',
      'Advanced analytics',
      'Priority support',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: 549,
    canBid: true,
    bidsPerMonth: -1,
    maxBidAmount: -1,
    portfolioPhotos: -1,
    portfolioVideos: -1,
    transactionFee: 3,
    features: [
      'Everything in Elite',
      'Instant notifications',
      'Smart scheduling',
      'Dedicated account manager',
      'API access',
      'Multi-location support',
    ],
  },
} as const;

export const CONSULTATION_FEES = [
  { id: 'under_100', label: 'Up to R$100', min: 0, max: 100 },
  { id: '100_200', label: 'R$100 - R$200', min: 100, max: 200 },
  { id: '200_350', label: 'R$200 - R$350', min: 200, max: 350 },
  { id: '350_500', label: 'R$350 - R$500', min: 350, max: 500 },
  { id: '500_750', label: 'R$500 - R$750', min: 500, max: 750 },
  { id: '750_1000', label: 'R$750 - R$1.000', min: 750, max: 1000 },
  { id: 'above_1000', label: 'Above R$1.000', min: 1000, max: null },
  { id: 'insurance', label: 'Insurance accepted', min: null, max: null },
] as const;

// Keep for backwards compatibility
export const BUDGET_RANGES = CONSULTATION_FEES;

export const URGENCY_LEVELS = [
  { id: 'emergency', label: 'Emergency', description: 'Within 24 hours' },
  { id: 'asap', label: 'Urgent', description: 'Within 1 week' },
  { id: 'flexible', label: 'Flexible', description: 'Within 1 month' },
  { id: 'scheduled', label: 'Scheduled', description: 'Specific date' },
] as const;

export const APPOINTMENT_TYPES = [
  { id: 'consultation', label: 'Consultation', icon: Stethoscope },
  { id: 'followup', label: 'Follow-up', icon: Clock },
  { id: 'teleconsultation', label: 'Teleconsultation', icon: Video },
  { id: 'checkup', label: 'Check-up', icon: Shield },
] as const;

export const COMMON_INSURANCE_PLANS = [
  'Unimed', 'Bradesco Saúde', 'SulAmérica', 'Amil', 'NotreDame Intermédica',
  'Hapvida', 'Porto Seguro Saúde', 'Prevent Senior', 'Golden Cross', 'Assim Saúde',
] as const;
