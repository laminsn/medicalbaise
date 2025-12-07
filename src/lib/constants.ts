import { 
  Sparkles, Droplet, Zap, Wind, Paintbrush, Hammer, 
  TreePine, Bug, Wrench, Home, Square, Refrigerator, 
  Truck, Lock, Waves, Blocks, Car, Sofa
} from "lucide-react";

export const SERVICE_CATEGORIES = [
  { id: 'cleaning', name_pt: 'Limpeza', name_en: 'Cleaning', icon: Sparkles, color: 'hsl(152 76% 36%)' },
  { id: 'plumbing', name_pt: 'Encanamento', name_en: 'Plumbing', icon: Droplet, color: 'hsl(211 96% 46%)' },
  { id: 'electrical', name_pt: 'Elétrica', name_en: 'Electrical', icon: Zap, color: 'hsl(45 93% 47%)' },
  { id: 'hvac', name_pt: 'Ar Condicionado', name_en: 'HVAC', icon: Wind, color: 'hsl(187 85% 43%)' },
  { id: 'painting', name_pt: 'Pintura', name_en: 'Painting', icon: Paintbrush, color: 'hsl(271 81% 56%)' },
  { id: 'carpentry', name_pt: 'Carpintaria', name_en: 'Carpentry', icon: Hammer, color: 'hsl(33 90% 45%)' },
  { id: 'landscaping', name_pt: 'Jardinagem', name_en: 'Landscaping', icon: TreePine, color: 'hsl(142 71% 45%)' },
  { id: 'pest', name_pt: 'Controle de Pragas', name_en: 'Pest Control', icon: Bug, color: 'hsl(0 84% 60%)' },
  { id: 'handyman', name_pt: 'Manutenção Geral', name_en: 'Handyman', icon: Wrench, color: 'hsl(239 84% 67%)' },
  { id: 'roofing', name_pt: 'Telhados', name_en: 'Roofing', icon: Home, color: 'hsl(25 15% 47%)' },
  { id: 'flooring', name_pt: 'Pisos', name_en: 'Flooring', icon: Square, color: 'hsl(271 81% 65%)' },
  { id: 'appliance', name_pt: 'Eletrodomésticos', name_en: 'Appliance Repair', icon: Refrigerator, color: 'hsl(330 81% 60%)' },
  { id: 'moving', name_pt: 'Mudanças', name_en: 'Moving', icon: Truck, color: 'hsl(168 76% 42%)' },
  { id: 'security', name_pt: 'Segurança e Chaveiro', name_en: 'Security & Locksmith', icon: Lock, color: 'hsl(220 15% 25%)' },
  { id: 'pool', name_pt: 'Piscinas', name_en: 'Pool & Spa', icon: Waves, color: 'hsl(199 89% 48%)' },
  { id: 'masonry', name_pt: 'Alvenaria', name_en: 'Masonry', icon: Blocks, color: 'hsl(28 74% 38%)' },
  { id: 'auto', name_pt: 'Serviços Automotivos', name_en: 'Auto Services', icon: Car, color: 'hsl(220 13% 40%)' },
  { id: 'home_decorator', name_pt: 'Decoração de Interiores e Exteriores', name_en: 'Home Decorator', icon: Sofa, color: 'hsl(340 65% 47%)' },
] as const;

export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Básico',
    price: 0,
    canBid: false,
    portfolioPhotos: 5,
    portfolioVideos: 0,
    transactionFee: 7,
    features: [
      'Perfil profissional',
      'Aparecer nas buscas',
      'Receber solicitações diretas',
      'Até 5 fotos no portfólio',
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
      'Tudo do Básico',
      'Enviar propostas em trabalhos',
      'Até 20 propostas/mês',
      'Até 20 fotos + 3 vídeos',
      'Gerenciamento de calendário',
    ],
  },
  elite: {
    name: 'Elite',
    price: 299,
    canBid: true,
    bidsPerMonth: -1, // unlimited
    maxBidAmount: -1, // unlimited
    portfolioPhotos: 50,
    portfolioVideos: 10,
    transactionFee: 4,
    features: [
      'Tudo do Pro',
      'Propostas ilimitadas',
      'Destaque nas buscas',
      'Selo Elite no perfil',
      'Analytics avançado',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: 549,
    canBid: true,
    bidsPerMonth: -1,
    maxBidAmount: -1,
    portfolioPhotos: -1, // unlimited
    portfolioVideos: -1, // unlimited
    transactionFee: 3,
    features: [
      'Tudo do Elite',
      'Notificações instantâneas',
      'Auto-bid inteligente',
      'Gerente de conta dedicado',
      'API access',
    ],
  },
} as const;

export const BUDGET_RANGES = [
  { id: 'under_100', label: 'Até R$100', min: 0, max: 100 },
  { id: '100_250', label: 'R$100 - R$250', min: 100, max: 250 },
  { id: '250_500', label: 'R$250 - R$500', min: 250, max: 500 },
  { id: '500_1000', label: 'R$500 - R$1.000', min: 500, max: 1000 },
  { id: '1000_2500', label: 'R$1.000 - R$2.500', min: 1000, max: 2500 },
  { id: '2500_5000', label: 'R$2.500 - R$5.000', min: 2500, max: 5000 },
  { id: '5000_10000', label: 'R$5.000 - R$10.000', min: 5000, max: 10000 },
  { id: 'above_10000', label: 'Acima de R$10.000', min: 10000, max: null },
  { id: 'open', label: 'A combinar', min: null, max: null },
] as const;

export const URGENCY_LEVELS = [
  { id: 'emergency', label: 'Emergência', description: 'Nas próximas 24 horas' },
  { id: 'asap', label: 'Urgente', description: 'Dentro de 1 semana' },
  { id: 'flexible', label: 'Flexível', description: 'Dentro de 1 mês' },
  { id: 'scheduled', label: 'Agendado', description: 'Data específica' },
] as const;