// Medical-specific constants for healthcare providers

export interface MedicalCategory {
  id: string;
  name_en: string;
  name_pt: string;
  icon: string;
  color: string;
  description_en: string;
  description_pt: string;
}

export const MEDICAL_CATEGORIES: MedicalCategory[] = [
  {
    id: 'cardiology',
    name_en: 'Cardiology',
    name_pt: 'Cardiologia',
    icon: 'Heart',
    color: 'red',
    description_en: 'Heart and cardiovascular system specialists',
    description_pt: 'Especialistas em coração e sistema cardiovascular',
  },
  {
    id: 'dermatology',
    name_en: 'Dermatology',
    name_pt: 'Dermatologia',
    icon: 'Scan',
    color: 'pink',
    description_en: 'Skin, hair, and nail specialists',
    description_pt: 'Especialistas em pele, cabelo e unhas',
  },
  {
    id: 'pediatrics',
    name_en: 'Pediatrics',
    name_pt: 'Pediatria',
    icon: 'Baby',
    color: 'blue',
    description_en: 'Child and adolescent health specialists',
    description_pt: 'Especialistas em saúde infantil e adolescente',
  },
  {
    id: 'orthopedics',
    name_en: 'Orthopedics',
    name_pt: 'Ortopedia',
    icon: 'Bone',
    color: 'orange',
    description_en: 'Bone, joint, and muscle specialists',
    description_pt: 'Especialistas em ossos, articulações e músculos',
  },
  {
    id: 'neurology',
    name_en: 'Neurology',
    name_pt: 'Neurologia',
    icon: 'Brain',
    color: 'purple',
    description_en: 'Brain and nervous system specialists',
    description_pt: 'Especialistas em cérebro e sistema nervoso',
  },
  {
    id: 'gynecology',
    name_en: 'Gynecology',
    name_pt: 'Ginecologia',
    icon: 'Users',
    color: 'rose',
    description_en: 'Women\'s reproductive health specialists',
    description_pt: 'Especialistas em saúde reprodutiva feminina',
  },
  {
    id: 'ophthalmology',
    name_en: 'Ophthalmology',
    name_pt: 'Oftalmologia',
    icon: 'Eye',
    color: 'cyan',
    description_en: 'Eye and vision specialists',
    description_pt: 'Especialistas em olhos e visão',
  },
  {
    id: 'psychiatry',
    name_en: 'Psychiatry',
    name_pt: 'Psiquiatria',
    icon: 'HeartHandshake',
    color: 'indigo',
    description_en: 'Mental health specialists',
    description_pt: 'Especialistas em saúde mental',
  },
  {
    id: 'general-practice',
    name_en: 'General Practice',
    name_pt: 'Clínica Geral',
    icon: 'Stethoscope',
    color: 'green',
    description_en: 'Primary care and general health',
    description_pt: 'Atenção primária e saúde geral',
  },
  {
    id: 'endocrinology',
    name_en: 'Endocrinology',
    name_pt: 'Endocrinologia',
    icon: 'Activity',
    color: 'amber',
    description_en: 'Hormone and metabolic specialists',
    description_pt: 'Especialistas em hormônios e metabolismo',
  },
  {
    id: 'gastroenterology',
    name_en: 'Gastroenterology',
    name_pt: 'Gastroenterologia',
    icon: 'Pill',
    color: 'lime',
    description_en: 'Digestive system specialists',
    description_pt: 'Especialistas em sistema digestivo',
  },
  {
    id: 'pulmonology',
    name_en: 'Pulmonology',
    name_pt: 'Pneumologia',
    icon: 'Wind',
    color: 'sky',
    description_en: 'Lung and respiratory specialists',
    description_pt: 'Especialistas em pulmões e sistema respiratório',
  },
  {
    id: 'urology',
    name_en: 'Urology',
    name_pt: 'Urologia',
    icon: 'Droplets',
    color: 'teal',
    description_en: 'Urinary tract and male reproductive specialists',
    description_pt: 'Especialistas em trato urinário e reprodução masculina',
  },
  {
    id: 'rheumatology',
    name_en: 'Rheumatology',
    name_pt: 'Reumatologia',
    icon: 'Bone',
    color: 'violet',
    description_en: 'Arthritis and autoimmune disease specialists',
    description_pt: 'Especialistas em artrite e doenças autoimunes',
  },
  {
    id: 'oncology',
    name_en: 'Oncology',
    name_pt: 'Oncologia',
    icon: 'ShieldPlus',
    color: 'red',
    description_en: 'Cancer treatment specialists',
    description_pt: 'Especialistas em tratamento de câncer',
  },
  {
    id: 'otolaryngology',
    name_en: 'ENT (Otolaryngology)',
    name_pt: 'Otorrinolaringologia',
    icon: 'Ear',
    color: 'emerald',
    description_en: 'Ear, nose, and throat specialists',
    description_pt: 'Especialistas em ouvido, nariz e garganta',
  },
  {
    id: 'emergency-emt',
    name_en: 'Emergency / EMT',
    name_pt: 'Emerg\u00eancia / SAMU',
    icon: 'Ambulance',
    color: 'red',
    description_en: 'Emergency medical technicians, paramedics, and ambulance services',
    description_pt: 'T\u00e9cnicos em emerg\u00eancia m\u00e9dica, param\u00e9dicos e servi\u00e7os de ambul\u00e2ncia',
  },
];

export const INSURANCE_PROVIDERS = [
  'Unimed',
  'Bradesco Saúde',
  'SulAmérica',
  'Amil',
  'NotreDame Intermédica',
  'Hapvida',
  'Porto Seguro Saúde',
  'Cassi',
  'Prevent Senior',
  'São Francisco Saúde',
  'Care Plus',
  'Golden Cross',
  'Mediservice',
  'Allianz Saúde',
  'Omint',
];

export const APPOINTMENT_TYPES = [
  {
    id: 'in-person',
    label_en: 'In-Person',
    label_pt: 'Presencial',
    icon: 'Hospital',
  },
  {
    id: 'teleconsultation',
    label_en: 'Video Consultation',
    label_pt: 'Teleconsulta',
    icon: 'Video',
  },
  {
    id: 'phone',
    label_en: 'Phone Consultation',
    label_pt: 'Consulta por Telefone',
    icon: 'Phone',
  },
  {
    id: 'home-visit',
    label_en: 'Home Visit',
    label_pt: 'Atendimento Domiciliar',
    icon: 'Home',
  },
];

export const URGENCY_LEVELS = [
  {
    id: 'emergency',
    label_en: 'Emergency',
    label_pt: 'Emergência',
    description_en: 'Requires immediate attention',
    description_pt: 'Requer atenção imediata',
  },
  {
    id: 'urgent',
    label_en: 'Urgent',
    label_pt: 'Urgente',
    description_en: 'Needs attention within 24-48 hours',
    description_pt: 'Precisa de atenção em 24-48 horas',
  },
  {
    id: 'routine',
    label_en: 'Routine',
    label_pt: 'Rotina',
    description_en: 'Regular scheduled appointment',
    description_pt: 'Consulta agendada regular',
  },
  {
    id: 'follow-up',
    label_en: 'Follow-up',
    label_pt: 'Retorno',
    description_en: 'Post-treatment follow-up',
    description_pt: 'Acompanhamento pós-tratamento',
  },
];

export const POPULAR_SPECIALTIES = [
  'general-practice',
  'cardiology',
  'dermatology',
  'pediatrics',
  'orthopedics',
  'gynecology',
];
