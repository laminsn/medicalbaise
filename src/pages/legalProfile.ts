export type LegalProfile = {
  appKey: 'casa' | 'legal' | 'medical';
  brandName: string;
  website: string;
  supportEmail: string;
  privacyEmail: string;
  customerEn: string;
  customerPt: string;
  providerEn: string;
  providerPt: string;
  providerEs: string;
  marketplaceEn: string;
  marketplacePt: string;
  marketplaceEs: string;
  sensitiveDataEn: string;
  sensitiveDataPt: string;
  sensitiveDataEs: string;
  professionalBoundaryEn: string;
  professionalBoundaryPt: string;
  emergencyEn?: string;
  emergencyPt?: string;
};

const profiles: Record<LegalProfile['appKey'], LegalProfile> = {
  casa: {
    appKey: 'casa',
    brandName: 'Casa Baise',
    website: 'casabaise.com',
    supportEmail: 'suporte@casabaise.com',
    privacyEmail: 'privacidade@casabaise.com',
    customerEn: 'customers',
    customerPt: 'clientes',
    providerEn: 'home service providers',
    providerPt: 'prestadores de serviços residenciais',
    providerEs: 'proveedores de servicios para el hogar',
    marketplaceEn: 'a Brazil-first home services marketplace connecting customers with independent providers for residential work, repairs, maintenance, cleaning, projects, quotes, scheduling, messaging, payments, and reviews',
    marketplacePt: 'um marketplace brasileiro de serviços residenciais que conecta clientes a prestadores independentes para manutenção, reparos, limpeza, projetos, orçamentos, agendamentos, mensagens, pagamentos e avaliações',
    marketplaceEs: 'un marketplace brasileño de servicios para el hogar que conecta a clientes con proveedores independientes para mantenimiento, reparaciones, limpieza, proyectos y trabajo residencial',
    sensitiveDataEn: 'home address, service history, photos, access instructions, payment records, messages, reviews, provider credentials, and safety notes',
    sensitiveDataPt: 'endereço residencial, histórico de serviços, fotos, instruções de acesso, registros de pagamento, mensagens, avaliações, credenciais dos prestadores e notas de segurança',
    sensitiveDataEs: 'dirección del domicilio, historial de servicios, fotos, instrucciones de acceso, registros de pago, mensajes, reseñas, credenciales del proveedor y notas de seguridad',
    professionalBoundaryEn: 'Casa Baise is not a contractor, construction company, insurer, employer, or guarantor of a provider result. Providers are independent and responsible for licenses, permits, insurance, safety, pricing, and work quality.',
    professionalBoundaryPt: 'A Casa Baise não e empreiteira, construtora, seguradora, empregadora nem garantidora de resultado do prestador. Os prestadores sao independentes e responsaveis por licenças, alvaras, seguros, segurança, precos e qualidade do trabalho.',
  },
  legal: {
    appKey: 'legal',
    brandName: 'Legal Baise',
    website: 'legalbaise.com',
    supportEmail: 'suporte@legalbaise.com',
    privacyEmail: 'privacidade@legalbaise.com',
    customerEn: 'clients',
    customerPt: 'clientes',
    providerEn: 'legal professionals',
    providerPt: 'profissionais jurídicos',
    providerEs: 'profesionales jurídicos',
    marketplaceEn: 'a Brazil-first legal professional marketplace connecting clients with independent lawyers, paralegals, notaries, and legal service providers for discovery, scheduling, messaging, payments, documents, and reviews',
    marketplacePt: 'um marketplace brasileiro de profissionais jurídicos que conecta clientes a advogados, paralegais, notários e prestadores jurídicos independentes para descoberta, agendamento, mensagens, pagamentos, documentos e avaliações',
    marketplaceEs: 'un marketplace brasileño de profesionales jurídicos que conecta a clientes con abogados, paralegales, notarios y prestadores jurídicos independientes',
    sensitiveDataEn: 'case descriptions, legal documents, attorney-client privileged information, identity data, payment records, messages, reviews, and professional credentials',
    sensitiveDataPt: 'descrições de casos, documentos jurídicos, informações protegidas por sigilo advogado-cliente, dados de identidade, registros de pagamento, mensagens, avaliações e credenciais profissionais',
    sensitiveDataEs: 'descripciones de casos, documentos jurídicos, información protegida por el secreto profesional, datos de identidad, registros de pago, mensajes, reseñas y credenciales profesionales',
    professionalBoundaryEn: 'Legal Baise is not a law firm, legal department, or legal representative. Legal advice, representation, deadlines, filings, and privileged counsel-client work are provided only by the independently licensed professional engaged by the client.',
    professionalBoundaryPt: 'A Legal Baise não e escritorio de advocacia, departamento jurídico nem representante legal. Consultoria jurídica, representação, prazos, petições e trabalho protegido por sigilo sao prestados apenas pelo profissional licenciado contratado pelo cliente.',
  },
  medical: {
    appKey: 'medical',
    brandName: 'Medical Baise',
    website: 'medicalbaise.com',
    supportEmail: 'suporte@medicalbaise.com',
    privacyEmail: 'privacidade@medicalbaise.com',
    customerEn: 'patients',
    customerPt: 'pacientes',
    providerEn: 'healthcare providers',
    providerPt: 'profissionais de saúde',
    providerEs: 'profesionales de salud',
    marketplaceEn: 'a Brazil-first healthcare marketplace connecting patients with independent healthcare providers for discovery, scheduling, telehealth support where permitted, messaging, payments, documents, and reviews',
    marketplacePt: 'um marketplace brasileiro de saúde que conecta pacientes a profissionais de saúde independentes para descoberta, agendamento, suporte a telessaude quando permitido, mensagens, pagamentos, documentos e avaliações',
    marketplaceEs: 'un marketplace brasileño de salud que conecta a pacientes con profesionales de salud independientes para descubrimiento, agendamiento, apoyo de telesalud y continuidad de la atención',
    sensitiveDataEn: 'health information, symptoms, appointment notes, telehealth metadata, identity data, payment records, messages, reviews, provider credentials, and care-related files',
    sensitiveDataPt: 'informações de saúde, sintomas, notas de consulta, metadados de telessaude, dados de identidade, registros de pagamento, mensagens, avaliações, credenciais profissionais e arquivos relacionados ao atendimento',
    sensitiveDataEs: 'información de salud, síntomas, notas de consulta, metadatos de telesalud, datos de identidad, registros de pago, mensajes, reseñas y credenciales del profesional',
    professionalBoundaryEn: 'Medical Baise is not a clinic, hospital, emergency service, insurer, or healthcare provider. Medical decisions, diagnosis, treatment, prescriptions, records, and professional duties belong to the independently licensed provider engaged by the patient.',
    professionalBoundaryPt: 'A Medical Baise não e clinica, hospital, serviço de emergência, seguradora nem prestadora de serviços de saúde. Decisoes medicas, diagnostico, tratamento, prescrições, prontuarios e deveres profissionais pertencem ao profissional licenciado contratado pelo paciente.',
    emergencyEn: 'Do not use Medical Baise for emergencies. In Brazil, call SAMU 192 or go to the nearest emergency service.',
    emergencyPt: 'Não use a Medical Baise para emergências. No Brasil, ligue para o SAMU 192 ou procure o pronto atendimento mais próximo.',
  },
};

export function getLegalProfile(): LegalProfile {
  const app = ((import.meta.env.VITE_BAISE_APP ?? 'casa') as string).trim().toLowerCase();
  if (app.includes('legal')) return profiles.legal;
  if (app.includes('medical') || app.includes('md')) return profiles.medical;
  return profiles.casa;
}
