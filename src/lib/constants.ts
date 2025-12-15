import { LucideIcon } from 'lucide-react';
import {
  Heart,
  Baby,
  Sparkles,
  Bone,
  User,
  Stethoscope,
  Brain,
  Smile,
  Eye,
  BrainCircuit,
  Ear,
  Syringe,
  Activity,
  Microscope,
  Pill,
  Video,
  Clock,
  Shield,
} from 'lucide-react';

export interface MedicalCategory {
  id: string;
  name_en: string;
  name_pt: string;
  icon: LucideIcon;
  color: string;
  description_en: string;
  description_pt: string;
}

export const MEDICAL_CATEGORIES: MedicalCategory[] = [
  {
    id: 'general-practice',
    name_en: 'General Practice',
    name_pt: 'Clínica Geral',
    icon: Stethoscope,
    color: '#06B6D4',
    description_en: 'Primary care and general medical consultation',
    description_pt: 'Atendimento primário e consulta médica geral',
  },
  {
    id: 'cardiology',
    name_en: 'Cardiology',
    name_pt: 'Cardiologia',
    icon: Heart,
    color: '#EF4444',
    description_en: 'Heart and cardiovascular care',
    description_pt: 'Cuidados cardíacos e cardiovasculares',
  },
  {
    id: 'dermatology',
    name_en: 'Dermatology',
    name_pt: 'Dermatologia',
    icon: Sparkles,
    color: '#8B5CF6',
    description_en: 'Skin, hair, and nail care',
    description_pt: 'Cuidados com pele, cabelo e unhas',
  },
  {
    id: 'pediatrics',
    name_en: 'Pediatrics',
    name_pt: 'Pediatria',
    icon: Baby,
    color: '#F59E0B',
    description_en: 'Children and adolescent care',
    description_pt: 'Cuidados infantis e adolescentes',
  },
  {
    id: 'dentistry',
    name_en: 'Dentistry',
    name_pt: 'Odontologia',
    icon: Smile,
    color: '#14B8A6',
    description_en: 'Dental and oral health',
    description_pt: 'Saúde dental e bucal',
  },
  {
    id: 'orthopedics',
    name_en: 'Orthopedics',
    name_pt: 'Ortopedia',
    icon: Bone,
    color: '#10B981',
    description_en: 'Bone, joint, and muscle care',
    description_pt: 'Cuidados com ossos, articulações e músculos',
  },
  {
    id: 'gynecology',
    name_en: 'Gynecology',
    name_pt: 'Ginecologia',
    icon: User,
    color: '#EC4899',
    description_en: "Women's health",
    description_pt: 'Saúde da mulher',
  },
  {
    id: 'psychiatry',
    name_en: 'Psychiatry',
    name_pt: 'Psiquiatria',
    icon: Brain,
    color: '#6366F1',
    description_en: 'Mental health and behavioral care',
    description_pt: 'Saúde mental e cuidados comportamentais',
  },
  {
    id: 'ophthalmology',
    name_en: 'Ophthalmology',
    name_pt: 'Oftalmologia',
    icon: Eye,
    color: '#3B82F6',
    description_en: 'Eye care and vision',
    description_pt: 'Cuidados com os olhos e visão',
  },
  {
    id: 'neurology',
    name_en: 'Neurology',
    name_pt: 'Neurologia',
    icon: BrainCircuit,
    color: '#7C3AED',
    description_en: 'Brain and nervous system',
    description_pt: 'Cérebro e sistema nervoso',
  },
  {
    id: 'ent',
    name_en: 'ENT (Ear, Nose, Throat)',
    name_pt: 'Otorrinolaringologia',
    icon: Ear,
    color: '#F97316',
    description_en: 'Ear, nose, and throat care',
    description_pt: 'Cuidados com ouvido, nariz e garganta',
  },
  {
    id: 'endocrinology',
    name_en: 'Endocrinology',
    name_pt: 'Endocrinologia',
    icon: Activity,
    color: '#84CC16',
    description_en: 'Hormone and metabolic disorders',
    description_pt: 'Distúrbios hormonais e metabólicos',
  },
  {
    id: 'gastroenterology',
    name_en: 'Gastroenterology',
    name_pt: 'Gastroenterologia',
    icon: Microscope,
    color: '#0EA5E9',
    description_en: 'Digestive system care',
    description_pt: 'Cuidados do sistema digestivo',
  },
  {
    id: 'urology',
    name_en: 'Urology',
    name_pt: 'Urologia',
    icon: Syringe,
    color: '#A855F7',
    description_en: 'Urinary tract and male reproductive health',
    description_pt: 'Saúde do trato urinário e reprodutivo masculino',
  },
  {
    id: 'oncology',
    name_en: 'Oncology',
    name_pt: 'Oncologia',
    icon: Pill,
    color: '#DC2626',
    description_en: 'Cancer diagnosis and treatment',
    description_pt: 'Diagnóstico e tratamento de câncer',
  },
];

// Popular specialties shown in hero
export const POPULAR_SPECIALTIES = [
  'general-practice',
  'cardiology',
  'dermatology',
  'pediatrics',
  'dentistry',
];

// Legacy SERVICE_CATEGORIES for backwards compatibility
export const SERVICE_CATEGORIES = MEDICAL_CATEGORIES.map(cat => ({
  id: cat.id,
  name_pt: cat.name_pt,
  name_en: cat.name_en,
  icon: cat.icon,
  color: cat.color,
}));

// Consultation fee ranges
export const CONSULTATION_FEE_RANGES = [
  { label: 'R$ 0 - R$ 100', min: 0, max: 100 },
  { label: 'R$ 100 - R$ 200', min: 100, max: 200 },
  { label: 'R$ 200 - R$ 300', min: 200, max: 300 },
  { label: 'R$ 300 - R$ 500', min: 300, max: 500 },
  { label: 'R$ 500 - R$ 1,000', min: 500, max: 1000 },
  { label: 'R$ 1,000+', min: 1000, max: null },
  { label: 'Covered by insurance', min: null, max: null },
];

// Legacy CONSULTATION_FEES for backwards compatibility
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

// Appointment types
export const APPOINTMENT_TYPES = [
  { id: 'in-person', label_en: 'In-Person', label_pt: 'Presencial', label: 'Consultation', icon: Stethoscope },
  { id: 'teleconsultation', label_en: 'Video Call', label_pt: 'Videochamada', label: 'Teleconsultation', icon: Video },
  { id: 'phone', label_en: 'Phone Call', label_pt: 'Ligação', label: 'Follow-up', icon: Clock },
  { id: 'home-visit', label_en: 'Home Visit', label_pt: 'Visita Domiciliar', label: 'Check-up', icon: Shield },
] as const;

// Insurance providers (Brazil-specific)
export const INSURANCE_PROVIDERS = [
  'Unimed',
  'Bradesco Saúde',
  'Amil',
  'SulAmérica',
  'Hapvida',
  'NotreDame Intermédica',
  'Porto Seguro',
  'Prevent Senior',
  'Golden Cross',
  'Allianz',
  'Particular (Self-pay)',
] as const;

// Legacy COMMON_INSURANCE_PLANS for backwards compatibility
export const COMMON_INSURANCE_PLANS = INSURANCE_PROVIDERS;

export const URGENCY_LEVELS = [
  { id: 'emergency', label: 'Emergency', description: 'Within 24 hours' },
  { id: 'asap', label: 'Urgent', description: 'Within 1 week' },
  { id: 'flexible', label: 'Flexible', description: 'Within 1 month' },
  { id: 'scheduled', label: 'Scheduled', description: 'Specific date' },
] as const;

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
