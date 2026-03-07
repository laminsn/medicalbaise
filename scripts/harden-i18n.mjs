import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const enPath = path.join(root, 'src/i18n/locales/en.json');
const ptPath = path.join(root, 'src/i18n/locales/pt.json');

function setDeep(obj, dottedKey, value) {
  const parts = dottedKey.split('.');
  let cursor = obj;

  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i];
    if (!cursor[key] || typeof cursor[key] !== 'object' || Array.isArray(cursor[key])) {
      cursor[key] = {};
    }
    cursor = cursor[key];
  }

  cursor[parts[parts.length - 1]] = value;
}

function loadLocale(localePath) {
  return JSON.parse(fs.readFileSync(localePath, 'utf8'));
}

function saveLocale(localePath, data) {
  fs.writeFileSync(localePath, `${JSON.stringify(data, null, 2)}\n`);
}

const enUpdates = {
  'address.street': 'Street',
  'address.streetPlaceholder': 'Street name',
  'address.number': 'Number',
  'address.numberPlaceholder': 'House/building number',
  'address.complement': 'Complement',
  'address.complementPlaceholder': 'Apartment, suite, etc. (optional)',
  'address.neighborhood': 'Neighborhood',
  'address.neighborhoodPlaceholder': 'Neighborhood',
  'address.cep': 'ZIP code (CEP)',
  'common.backToBrowse': 'Back to browse',
  'common.done': 'Done',
  'common.linkCopied': 'Link copied',
  'common.reload': 'Reload',
  'common.shared': 'Shared successfully',
  'common.tryAgain': 'Try again',
  'jobs.additionalDetails': 'Additional details',
  'jobs.bidSubmittedSuccess': 'Response submitted successfully',
  'jobs.days': 'days',
  'jobs.errorSubmittingBid': 'Failed to submit response',
  'jobs.estimatedDuration': 'Estimated duration',
  'jobs.fillRequiredFields': 'Please fill in all required fields',
  'jobs.materialsIncluded': 'Materials included',
  'jobs.messageProvider': 'Message provider',
  'jobs.mustBeProvider': 'You must be a provider to respond',
  'jobs.proposalPlaceholder': 'Describe your proposal and approach...',
  'jobs.submitProposal': 'Submit response',
  'jobs.upgradeToSubmitBid': 'Upgrade your plan to submit responses',
  'jobs.warranty': 'Warranty',
  'jobs.warrantyPlaceholder': 'e.g., 90-day warranty',
  'jobs.yourPrice': 'Your price',
  'jobs.yourProposal': 'Your proposal',
  'messages.eliteRequired': 'Elite plan required',
  'messages.startError': 'Failed to start conversation',
  'postJob.errorPosting': 'Failed to submit request',
  'provider.acceptedFormats': 'Accepted formats: JPG, PNG, PDF (max 5MB each)',
  'provider.createProfile': 'Create profile',
  'provider.servicesOfferedDescription': 'Select all services you provide',
  'videoTestimonials.approvalNote': 'Your testimonial will be reviewed before publishing',
  'videoTestimonials.descriptionLabel': 'Description',
  'videoTestimonials.descriptionPlaceholder': 'Share your experience...',
  'videoTestimonials.noTestimonials': 'No testimonials yet',
  'videoTestimonials.selectVideo': 'Select video',
  'videoTestimonials.submit': 'Submit testimonial',
  'videoTestimonials.titleLabel': 'Title',
  'videoTestimonials.titlePlaceholder': 'e.g., Great service',
  'videoTestimonials.uploadTitle': 'Upload video testimonial',
  'videoTestimonials.uploading': 'Uploading...',
  'workApproval.acceptedFormats': 'JPG, PNG, WebP, MP4, WebM • Max 50MB',
  'workApproval.approved': 'Approved',
  'workApproval.caption': 'Caption',
  'workApproval.captionPlaceholder': 'Describe the completed work...',
  'workApproval.customerFeedback': 'Customer feedback',
  'workApproval.feedbackPlaceholder': 'Describe required changes...',
  'workApproval.noApproved': 'No approved items',
  'workApproval.noMediaCustomer': 'No submissions from the provider yet',
  'workApproval.noMediaProvider': 'Upload photos/videos for customer approval',
  'workApproval.noPending': 'No pending items',
  'workApproval.noRejected': 'No items needing changes',
  'workApproval.pending': 'Pending',
  'workApproval.rejected': 'Needs changes',
  'workApproval.requestChanges': 'Request changes',
  'workApproval.requestChangesDescription': 'Describe what should be improved before approval.',
  'workApproval.requestChangesTitle': 'Request changes',
  'workApproval.selectMedia': 'Select image or video',
  'workApproval.submitFeedback': 'Submit feedback',
  'workApproval.title': 'Work approval',
  'workApproval.upload': 'Upload for approval',
  'workApproval.uploadWork': 'Upload work for approval',
  'workApproval.uploading': 'Uploading...',
};

const ptUpdates = {
  'address.street': 'Rua',
  'address.streetPlaceholder': 'Nome da rua',
  'address.number': 'Número',
  'address.numberPlaceholder': 'Número do imóvel',
  'address.complement': 'Complemento',
  'address.complementPlaceholder': 'Apartamento, bloco, etc. (opcional)',
  'address.neighborhood': 'Bairro',
  'address.neighborhoodPlaceholder': 'Bairro',
  'address.cep': 'CEP',
  'common.backToBrowse': 'Voltar para explorar',
  'common.done': 'Concluído',
  'common.linkCopied': 'Link copiado',
  'common.reload': 'Recarregar',
  'common.shared': 'Compartilhado com sucesso',
  'common.tryAgain': 'Tente novamente',
  'jobs.additionalDetails': 'Detalhes adicionais',
  'jobs.bidSubmittedSuccess': 'Resposta enviada com sucesso',
  'jobs.days': 'dias',
  'jobs.errorSubmittingBid': 'Falha ao enviar resposta',
  'jobs.estimatedDuration': 'Duração estimada',
  'jobs.fillRequiredFields': 'Preencha todos os campos obrigatórios',
  'jobs.materialsIncluded': 'Materiais inclusos',
  'jobs.messageProvider': 'Mensagem para o profissional',
  'jobs.mustBeProvider': 'Você precisa ser um profissional para responder',
  'jobs.proposalPlaceholder': 'Descreva sua proposta e abordagem...',
  'jobs.submitProposal': 'Enviar resposta',
  'jobs.upgradeToSubmitBid': 'Faça upgrade do plano para enviar respostas',
  'jobs.warranty': 'Garantia',
  'jobs.warrantyPlaceholder': 'Ex.: garantia de 90 dias',
  'jobs.yourPrice': 'Seu preço',
  'jobs.yourProposal': 'Sua proposta',
  'messages.eliteRequired': 'Plano Elite necessário',
  'messages.startError': 'Falha ao iniciar conversa',
  'postJob.errorPosting': 'Falha ao enviar solicitação',
  'provider.acceptedFormats': 'Formatos aceitos: JPG, PNG, PDF (máx 5MB cada)',
  'provider.createProfile': 'Criar perfil',
  'provider.servicesOfferedDescription': 'Selecione todos os serviços que você oferece',
  'videoTestimonials.approvalNote': 'Seu depoimento será revisado antes da publicação',
  'videoTestimonials.descriptionLabel': 'Descrição',
  'videoTestimonials.descriptionPlaceholder': 'Compartilhe sua experiência...',
  'videoTestimonials.noTestimonials': 'Nenhum depoimento ainda',
  'videoTestimonials.selectVideo': 'Selecionar vídeo',
  'videoTestimonials.submit': 'Enviar depoimento',
  'videoTestimonials.titleLabel': 'Título',
  'videoTestimonials.titlePlaceholder': 'Ex.: Excelente atendimento',
  'videoTestimonials.uploadTitle': 'Enviar depoimento em vídeo',
  'videoTestimonials.uploading': 'Enviando...',
  'workApproval.acceptedFormats': 'JPG, PNG, WebP, MP4, WebM • Máx 50MB',
  'workApproval.approved': 'Aprovado',
  'workApproval.caption': 'Legenda',
  'workApproval.captionPlaceholder': 'Descreva o trabalho concluído...',
  'workApproval.customerFeedback': 'Feedback do cliente',
  'workApproval.feedbackPlaceholder': 'Descreva as alterações necessárias...',
  'workApproval.noApproved': 'Nenhum item aprovado',
  'workApproval.noMediaCustomer': 'Nenhum envio do profissional ainda',
  'workApproval.noMediaProvider': 'Envie fotos/vídeos para aprovação do cliente',
  'workApproval.noPending': 'Nenhum item pendente',
  'workApproval.noRejected': 'Nenhum item com solicitação de ajustes',
  'workApproval.pending': 'Pendente',
  'workApproval.rejected': 'Necessita ajustes',
  'workApproval.requestChanges': 'Solicitar ajustes',
  'workApproval.requestChangesDescription': 'Descreva o que precisa ser melhorado antes da aprovação.',
  'workApproval.requestChangesTitle': 'Solicitar ajustes',
  'workApproval.selectMedia': 'Selecione imagem ou vídeo',
  'workApproval.submitFeedback': 'Enviar feedback',
  'workApproval.title': 'Aprovação de trabalho',
  'workApproval.upload': 'Enviar para aprovação',
  'workApproval.uploadWork': 'Enviar trabalho para aprovação',
  'workApproval.uploading': 'Enviando...',
};

const en = loadLocale(enPath);
const pt = loadLocale(ptPath);

Object.entries(enUpdates).forEach(([key, value]) => setDeep(en, key, value));
Object.entries(ptUpdates).forEach(([key, value]) => setDeep(pt, key, value));

saveLocale(enPath, en);
saveLocale(ptPath, pt);
