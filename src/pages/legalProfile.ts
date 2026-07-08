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
  marketplaceEn: string;
  marketplacePt: string;
  sensitiveDataEn: string;
  sensitiveDataPt: string;
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
    providerPt: 'prestadores de servicos residenciais',
    marketplaceEn: 'a Brazil-first home services marketplace connecting customers with independent providers for residential work, repairs, maintenance, cleaning, projects, quotes, scheduling, messaging, payments, and reviews',
    marketplacePt: 'um marketplace brasileiro de servicos residenciais que conecta clientes a prestadores independentes para manutencao, reparos, limpeza, projetos, orcamentos, agendamentos, mensagens, pagamentos e avaliacoes',
    sensitiveDataEn: 'home address, service history, photos, access instructions, payment records, messages, reviews, provider credentials, and safety notes',
    sensitiveDataPt: 'endereco residencial, historico de servicos, fotos, instrucoes de acesso, registros de pagamento, mensagens, avaliacoes, credenciais dos prestadores e notas de seguranca',
    professionalBoundaryEn: 'Casa Baise is not a contractor, construction company, insurer, employer, or guarantor of a provider result. Providers are independent and responsible for licenses, permits, insurance, safety, pricing, and work quality.',
    professionalBoundaryPt: 'A Casa Baise nao e empreiteira, construtora, seguradora, empregadora nem garantidora de resultado do prestador. Os prestadores sao independentes e responsaveis por licencas, alvaras, seguros, seguranca, precos e qualidade do trabalho.',
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
    providerPt: 'profissionais juridicos',
    marketplaceEn: 'a Brazil-first legal professional marketplace connecting clients with independent lawyers, paralegals, notaries, and legal service providers for discovery, scheduling, messaging, payments, documents, and reviews',
    marketplacePt: 'um marketplace brasileiro de profissionais juridicos que conecta clientes a advogados, paralegais, notarios e prestadores juridicos independentes para descoberta, agendamento, mensagens, pagamentos, documentos e avaliacoes',
    sensitiveDataEn: 'case descriptions, legal documents, attorney-client privileged information, identity data, payment records, messages, reviews, and professional credentials',
    sensitiveDataPt: 'descricoes de casos, documentos juridicos, informacoes protegidas por sigilo advogado-cliente, dados de identidade, registros de pagamento, mensagens, avaliacoes e credenciais profissionais',
    professionalBoundaryEn: 'Legal Baise is not a law firm, legal department, or legal representative. Legal advice, representation, deadlines, filings, and privileged counsel-client work are provided only by the independently licensed professional engaged by the client.',
    professionalBoundaryPt: 'A Legal Baise nao e escritorio de advocacia, departamento juridico nem representante legal. Consultoria juridica, representacao, prazos, peticoes e trabalho protegido por sigilo sao prestados apenas pelo profissional licenciado contratado pelo cliente.',
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
    providerPt: 'profissionais de saude',
    marketplaceEn: 'a Brazil-first healthcare marketplace connecting patients with independent healthcare providers for discovery, scheduling, telehealth support where permitted, messaging, payments, documents, and reviews',
    marketplacePt: 'um marketplace brasileiro de saude que conecta pacientes a profissionais de saude independentes para descoberta, agendamento, suporte a telessaude quando permitido, mensagens, pagamentos, documentos e avaliacoes',
    sensitiveDataEn: 'health information, symptoms, appointment notes, telehealth metadata, identity data, payment records, messages, reviews, provider credentials, and care-related files',
    sensitiveDataPt: 'informacoes de saude, sintomas, notas de consulta, metadados de telessaude, dados de identidade, registros de pagamento, mensagens, avaliacoes, credenciais profissionais e arquivos relacionados ao atendimento',
    professionalBoundaryEn: 'Medical Baise is not a clinic, hospital, emergency service, insurer, or healthcare provider. Medical decisions, diagnosis, treatment, prescriptions, records, and professional duties belong to the independently licensed provider engaged by the patient.',
    professionalBoundaryPt: 'A Medical Baise nao e clinica, hospital, servico de emergencia, seguradora nem prestadora de servicos de saude. Decisoes medicas, diagnostico, tratamento, prescricoes, prontuarios e deveres profissionais pertencem ao profissional licenciado contratado pelo paciente.',
    emergencyEn: 'Do not use Medical Baise for emergencies. In Brazil, call SAMU 192 or go to the nearest emergency service.',
    emergencyPt: 'Nao use a Medical Baise para emergencias. No Brasil, ligue para o SAMU 192 ou procure o pronto atendimento mais proximo.',
  },
};

export function getLegalProfile(): LegalProfile {
  const app = ((import.meta.env.VITE_BAISE_APP ?? 'casa') as string).trim().toLowerCase();
  if (app.includes('legal')) return profiles.legal;
  if (app.includes('medical') || app.includes('md')) return profiles.medical;
  return profiles.casa;
}
