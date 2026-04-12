import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function Terms() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isPt = (i18n.language || '').startsWith('pt') || (i18n.language || '').startsWith('es');

  return (
    <AppLayout>
      <Helmet>
        <title>{t('legal.termsTitle', 'Terms of Service')} - MD Baise</title>
      </Helmet>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back', 'Back')}
        </Button>

        <h1 className="text-3xl font-bold mb-6">
          {isPt ? 'Termos de Servi\u00e7o' : 'Terms of Service'}
        </h1>
        <p className="text-muted-foreground mb-8">
          {isPt ? '\u00daltima atualiza\u00e7\u00e3o: 12 de abril de 2026' : 'Last updated: April 12, 2026'}
        </p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '1. Defini\u00e7\u00f5es' : '1. Key Definitions'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Nestes Termos de Servi\u00e7o, os seguintes termos t\u00eam os significados indicados:'
                : 'In these Terms of Service, the following terms have the meanings indicated:'}
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>{isPt ? '"Plataforma" refere-se ao site, aplicativo m\u00f3vel e servi\u00e7os operados pela MD Baise.' : '"Platform" refers to the website, mobile application, and services operated by MD Baise.'}</li>
              <li>{isPt ? '"Cliente/Paciente" refere-se a qualquer usu\u00e1rio que busca servi\u00e7os de sa\u00fade atrav\u00e9s da Plataforma.' : '"Client/Patient" refers to any user seeking healthcare services through the Platform.'}</li>
              <li>{isPt ? '"Profissional de Sa\u00fade" refere-se a m\u00e9dicos, dentistas, psic\u00f3logos e outros profissionais registrados.' : '"Healthcare Provider" refers to doctors, dentists, psychologists, and other registered professionals.'}</li>
              <li>{isPt ? '"Consulta" refere-se a qualquer atendimento m\u00e9dico agendado atrav\u00e9s da Plataforma, presencial ou por teleconsulta.' : '"Consultation" refers to any medical appointment booked through the Platform, in-person or via teleconsultation.'}</li>
              <li>{isPt ? '"Servi\u00e7os" refere-se a quaisquer servi\u00e7os de sa\u00fade oferecidos por Profissionais atrav\u00e9s da Plataforma.' : '"Services" refers to any healthcare services offered by Providers through the Platform.'}</li>
              <li>{isPt ? '"Assinatura" refere-se aos planos de assinatura dispon\u00edveis: Gratuito, Pro, Elite e Enterprise.' : '"Subscription" refers to available subscription tiers: Free, Pro, Elite, and Enterprise.'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '2. Aceita\u00e7\u00e3o dos Termos' : '2. Acceptance of Terms'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Ao acessar ou usar a plataforma MD Baise, voc\u00ea concorda em estar vinculado a estes Termos de Servi\u00e7o. Se voc\u00ea n\u00e3o concordar com qualquer parte destes termos, n\u00e3o deve usar a Plataforma. Voc\u00ea deve ter pelo menos 18 anos de idade para criar uma conta e usar nossos servi\u00e7os.'
                : 'By accessing or using the MD Baise platform, you agree to be bound by these Terms of Service. If you do not agree to any part of these terms, you must not use the Platform. You must be at least 18 years of age to create an account and use our services.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '3. Descri\u00e7\u00e3o do Servi\u00e7o' : '3. Description of Service'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'MD Baise \u00e9 um marketplace que conecta pacientes a profissionais de sa\u00fade no Brasil. Facilitamos a descoberta, agendamento, comunica\u00e7\u00e3o e transa\u00e7\u00f5es entre as partes. A MD Baise N\u00c3O \u00e9 uma cl\u00ednica, hospital ou prestadora de servi\u00e7os de sa\u00fade. N\u00e3o somos parte do contrato de servi\u00e7o entre pacientes e profissionais, e n\u00e3o prestamos, supervisionamos ou endossamos nenhum servi\u00e7o m\u00e9dico oferecido na Plataforma.'
                : 'MD Baise is a marketplace connecting patients with healthcare professionals in Brazil. We facilitate discovery, scheduling, communication, and transactions between parties. MD Baise is NOT a clinic, hospital, or healthcare provider. We are not a party to the service contract between patients and providers, and we do not provide, supervise, or endorse any medical services offered on the Platform.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '4. Modifica\u00e7\u00f5es dos Termos' : '4. Modifications to Terms'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Reservamo-nos o direito de modificar estes Termos a qualquer momento. Notificaremos os usu\u00e1rios sobre altera\u00e7\u00f5es materiais com pelo menos 30 dias de anteced\u00eancia por e-mail ou notifica\u00e7\u00e3o na Plataforma. O uso continuado da Plataforma ap\u00f3s a entrada em vigor das altera\u00e7\u00f5es constitui aceita\u00e7\u00e3o dos novos termos.'
                : 'We reserve the right to modify these Terms at any time. We will notify users of material changes at least 30 days in advance via email or Platform notification. Continued use of the Platform after changes take effect constitutes acceptance of the new terms.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '5. Contas de Usu\u00e1rio' : '5. User Accounts'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Voc\u00ea deve fornecer informa\u00e7\u00f5es precisas e completas ao criar uma conta. \u00c9 permitida apenas uma conta por pessoa. Voc\u00ea \u00e9 respons\u00e1vel por manter a seguran\u00e7a de sua conta, incluindo senha e credenciais de acesso, e por todas as atividades que ocorram sob ela. Notifique-nos imediatamente sobre qualquer uso n\u00e3o autorizado. O compartilhamento de contas \u00e9 estritamente proibido.'
                : 'You must provide accurate and complete information when creating an account. Only one account per person is permitted. You are responsible for maintaining the security of your account, including password and access credentials, and for all activities that occur under it. Notify us immediately of any unauthorized use. Account sharing is strictly prohibited.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '6. Obriga\u00e7\u00f5es do Profissional de Sa\u00fade' : '6. Healthcare Provider Obligations'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Profissionais de sa\u00fade que utilizam a Plataforma devem:'
                : 'Healthcare providers using the Platform must:'}
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>{isPt ? 'Manter registro v\u00e1lido no CRM (Conselho Regional de Medicina) ou conselho profissional equivalente' : 'Maintain valid CRM (Regional Medical Council) registration or equivalent professional council registration'}</li>
              <li>{isPt ? 'Possuir seguro de responsabilidade profissional conforme exigido pela legisla\u00e7\u00e3o brasileira' : 'Hold professional liability insurance as required by Brazilian law'}</li>
              <li>{isPt ? 'Cumprir as normas \u00e9ticas do CFM (Conselho Federal de Medicina) e resolu\u00e7\u00f5es aplic\u00e1veis' : 'Comply with CFM (Federal Medical Council) ethical standards and applicable resolutions'}</li>
              <li>{isPt ? 'Manter pre\u00e7os e disponibilidade anunciados precisos e atualizados' : 'Keep advertised prices and availability accurate and up to date'}</li>
              <li>{isPt ? 'Prestar servi\u00e7os de forma profissional e de acordo com os padr\u00f5es da pr\u00e1tica m\u00e9dica' : 'Deliver services professionally and in accordance with medical practice standards'}</li>
              <li>{isPt ? 'Manter confidencialidade das informa\u00e7\u00f5es dos pacientes conforme a LGPD e o sigilo m\u00e9dico' : 'Maintain patient information confidentiality per LGPD and medical confidentiality rules'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '7. Verifica\u00e7\u00e3o Profissional' : '7. Professional Verification'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'A MD Baise pode verificar credenciais profissionais, incluindo registro no CRM, especializa\u00e7\u00f5es e antecedentes. Profissionais verificados recebem um selo de verifica\u00e7\u00e3o em seus perfis. No entanto, a verifica\u00e7\u00e3o n\u00e3o constitui endosso ou garantia da qualidade dos servi\u00e7os. Os pacientes devem sempre exercer seu pr\u00f3prio julgamento ao escolher um profissional.'
                : 'MD Baise may verify professional credentials, including CRM registration, specializations, and background checks. Verified professionals receive a verification badge on their profiles. However, verification does not constitute endorsement or guarantee of service quality. Patients should always exercise their own judgment when choosing a provider.'}
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              {isPt
                ? 'A Baise verifica credenciais na medida de sua capacidade, utilizando os documentos fornecidos pelos profissionais. A Baise n\u00e3o se responsabiliza por documentos falsificados, forjados ou adulterados. Profissionais que apresentarem credenciais fraudulentas ser\u00e3o permanentemente banidos e poder\u00e3o enfrentar a\u00e7\u00f5es legais. A Baise n\u00e3o garante a autenticidade de credenciais al\u00e9m do que pode ser razoavelmente verificado a partir dos documentos apresentados.'
                : 'Baise verifies credentials to the best of its ability using the documents provided by professionals. Baise is not liable for falsified, forged, or misrepresented documents. Professionals who submit fraudulent credentials will be permanently banned and may face legal action. Baise makes no guarantee of the authenticity of credentials beyond what can reasonably be verified from submitted documents.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '8. Responsabilidades do Paciente' : '8. Patient Responsibilities'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Pacientes devem fornecer informa\u00e7\u00f5es de sa\u00fade precisas e relevantes aos profissionais, publicar avalia\u00e7\u00f5es honestas e baseadas em fatos, efetuar pagamentos pontualmente e tratar todos os profissionais com respeito. O uso da Plataforma n\u00e3o substitui o acompanhamento m\u00e9dico regular ou atendimento de emerg\u00eancia.'
                : 'Patients must provide accurate and relevant health information to providers, post honest and fact-based reviews, make timely payments, and treat all providers with respect. Use of the Platform does not replace regular medical care or emergency services.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '9. Consultas e Agendamentos' : '9. Consultations & Appointments'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Consultas agendadas atrav\u00e9s da Plataforma est\u00e3o sujeitas \u00e0s pol\u00edticas de cancelamento do profissional. Em geral, cancelamentos devem ser feitos com pelo menos 24 horas de anteced\u00eancia. N\u00e3o comparecimentos (no-shows) podem resultar em cobran\u00e7as. Teleconsultas est\u00e3o sujeitas \u00e0s normas do CFM sobre telemedicina e requerem consentimento pr\u00e9vio do paciente.'
                : 'Consultations booked through the Platform are subject to provider cancellation policies. Generally, cancellations should be made at least 24 hours in advance. No-shows may result in charges. Teleconsultations are subject to CFM telemedicine regulations and require prior patient consent.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '10. Pagamentos e Cobran\u00e7as' : '10. Payments & Billing'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Os pagamentos s\u00e3o processados de forma segura pelo Stripe em Reais Brasileiros (BRL). Aceitamos cart\u00f5es de cr\u00e9dito, d\u00e9bito e PIX. Taxas de servi\u00e7o podem ser aplicadas e ser\u00e3o exibidas antes da confirma\u00e7\u00e3o. Os profissionais definem seus pr\u00f3prios pre\u00e7os. A MD Baise n\u00e3o \u00e9 respons\u00e1vel por disputas de pre\u00e7os entre pacientes e profissionais. Reembolsos est\u00e3o sujeitos \u00e0 pol\u00edtica de cada profissional e \u00e0s disposi\u00e7\u00f5es do C\u00f3digo de Defesa do Consumidor.'
                : 'Payments are securely processed by Stripe in Brazilian Reais (BRL). We accept credit cards, debit cards, and PIX. Service fees may apply and will be displayed before confirmation. Providers set their own prices. MD Baise is not responsible for pricing disputes between patients and providers. Refunds are subject to each provider\'s policy and Consumer Protection Code provisions.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '11. Assinaturas' : '11. Subscriptions'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'A MD Baise oferece planos de assinatura para profissionais: Gratuito, Pro, Elite e Enterprise. As assinaturas s\u00e3o renovadas automaticamente. Voc\u00ea pode cancelar a qualquer momento atrav\u00e9s das configura\u00e7\u00f5es da conta ou do portal do Stripe. O cancelamento entra em vigor no final do per\u00edodo de cobran\u00e7a atual. N\u00e3o h\u00e1 reembolsos proporcionais para cancelamentos antecipados. O acesso aos recursos do plano continua at\u00e9 o final do per\u00edodo pago.'
                : 'MD Baise offers subscription plans for providers: Free, Pro, Elite, and Enterprise. Subscriptions auto-renew. You may cancel at any time through account settings or the Stripe portal. Cancellation takes effect at the end of the current billing period. No prorated refunds for early cancellation. Plan feature access continues until the end of the paid period.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '12. Conte\u00fado do Usu\u00e1rio' : '12. User Content'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Voc\u00ea mant\u00e9m a propriedade do conte\u00fado que publica na Plataforma (avalia\u00e7\u00f5es, fotos, depoimentos). Ao publicar, voc\u00ea concede \u00e0 MD Baise uma licen\u00e7a n\u00e3o exclusiva, mundial e sem royalties para usar, exibir e distribuir esse conte\u00fado na Plataforma e em materiais de marketing. Conte\u00fado proibido inclui: informa\u00e7\u00f5es m\u00e9dicas falsas, material difamat\u00f3rio, spam, conte\u00fado ilegal ou que viole direitos de terceiros.'
                : 'You retain ownership of content you post on the Platform (reviews, photos, testimonials). By posting, you grant MD Baise a non-exclusive, worldwide, royalty-free license to use, display, and distribute this content on the Platform and in marketing materials. Prohibited content includes: false medical information, defamatory material, spam, illegal content, or content that violates third-party rights.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '13. Avalia\u00e7\u00f5es e Classifica\u00e7\u00f5es' : '13. Reviews & Ratings'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Avalia\u00e7\u00f5es devem ser aut\u00eanticas e baseadas em experi\u00eancias reais. Manipula\u00e7\u00e3o de avalia\u00e7\u00f5es, incluindo avalia\u00e7\u00f5es falsas, troca de avalia\u00e7\u00f5es por benef\u00edcios ou intimida\u00e7\u00e3o de avaliadores, \u00e9 estritamente proibida. Profissionais podem responder publicamente \u00e0s avalia\u00e7\u00f5es. A MD Baise reserva-se o direito de remover avalia\u00e7\u00f5es que violem estes Termos.'
                : 'Reviews must be authentic and based on real experiences. Review manipulation, including fake reviews, exchanging reviews for benefits, or intimidating reviewers, is strictly prohibited. Providers may publicly respond to reviews. MD Baise reserves the right to remove reviews that violate these Terms.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '14. Propriedade Intelectual' : '14. Intellectual Property'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Todo o conte\u00fado, design, c\u00f3digo, marcas registradas e outros materiais da Plataforma s\u00e3o propriedade da MD Baise ou de seus licenciadores. O uso n\u00e3o autorizado de nossa propriedade intelectual \u00e9 proibido. Se voc\u00ea acredita que conte\u00fado na Plataforma viola seus direitos autorais, entre em contato conosco com as informa\u00e7\u00f5es necess\u00e1rias para an\u00e1lise.'
                : 'All Platform content, design, code, trademarks, and other materials are the property of MD Baise or its licensors. Unauthorized use of our intellectual property is prohibited. If you believe content on the Platform infringes your copyright, contact us with the necessary information for review.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '15. Confidencialidade e Privacidade M\u00e9dica' : '15. Confidentiality & Medical Privacy'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'A confidencialidade m\u00e9dica \u00e9 protegida pela legisla\u00e7\u00e3o brasileira, pelo C\u00f3digo de \u00c9tica M\u00e9dica e pela LGPD. Dados de sa\u00fade s\u00e3o classificados como dados pessoais sens\u00edveis e recebem prote\u00e7\u00e3o adicional. Profissionais devem manter sigilo sobre todas as informa\u00e7\u00f5es dos pacientes. A MD Baise implementa medidas t\u00e9cnicas e organizacionais para proteger dados de sa\u00fade, incluindo criptografia e controles de acesso rigorosos.'
                : 'Medical confidentiality is protected by Brazilian law, the Medical Ethics Code, and LGPD. Health data is classified as sensitive personal data and receives additional protection. Providers must maintain confidentiality of all patient information. MD Baise implements technical and organizational measures to protect health data, including encryption and strict access controls.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '16. Conduta Proibida' : '16. Prohibited Conduct'}
            </h2>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>{isPt ? 'Exerc\u00edcio ilegal da medicina ou de qualquer profiss\u00e3o de sa\u00fade' : 'Illegal practice of medicine or any healthcare profession'}</li>
              <li>{isPt ? 'Fornecimento de informa\u00e7\u00f5es m\u00e9dicas falsas ou enganosas' : 'Providing false or misleading medical information'}</li>
              <li>{isPt ? 'Ass\u00e9dio, discrimina\u00e7\u00e3o ou abuso contra outros usu\u00e1rios' : 'Harassment, discrimination, or abuse against other users'}</li>
              <li>{isPt ? 'Contornar o sistema de pagamento da Plataforma' : 'Circumventing the Platform payment system'}</li>
              <li>{isPt ? 'Publicar avalia\u00e7\u00f5es falsas ou manipuladas' : 'Posting fake or manipulated reviews'}</li>
              <li>{isPt ? 'Solicitar pacientes para fora da Plataforma para evitar taxas' : 'Soliciting patients off-Platform to avoid fees'}</li>
              <li>{isPt ? 'Coletar dados pessoais de outros usu\u00e1rios sem consentimento' : 'Collecting personal data from other users without consent'}</li>
              <li>{isPt ? 'Usar a Plataforma para fins ilegais ou n\u00e3o autorizados' : 'Using the Platform for illegal or unauthorized purposes'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '17. Aus\u00eancia de Endosso ou Garantia' : '17. No Endorsement or Warranty'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'A MD Baise N\u00c3O endossa, recomenda ou garante nenhum profissional de sa\u00fade, servi\u00e7o, tratamento ou resultado m\u00e9dico. Os profissionais s\u00e3o contratados independentes, n\u00e3o funcion\u00e1rios da MD Baise. A presen\u00e7a de um profissional na Plataforma, incluindo selos de verifica\u00e7\u00e3o, n\u00e3o constitui endosso. Pacientes s\u00e3o respons\u00e1veis por suas pr\u00f3prias decis\u00f5es de sa\u00fade.'
                : 'MD Baise does NOT endorse, recommend, or guarantee any healthcare provider, service, treatment, or medical outcome. Providers are independent contractors, not MD Baise employees. A provider\'s presence on the Platform, including verification badges, does not constitute endorsement. Patients are responsible for their own healthcare decisions.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '18. Resolu\u00e7\u00e3o de Disputas' : '18. Dispute Resolution'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Disputas entre pacientes e profissionais devem ser resolvidas preferencialmente por media\u00e7\u00e3o. A MD Baise pode mediar disputas, mas n\u00e3o garante resultados espec\u00edficos. Reclama\u00e7\u00f5es devem ser feitas dentro de 48 horas ap\u00f3s o servi\u00e7o. Os direitos do consumidor previstos no C\u00f3digo de Defesa do Consumidor (CDC) s\u00e3o preservados integralmente. Para disputas n\u00e3o resolvidas por media\u00e7\u00e3o, aplica-se a jurisdi\u00e7\u00e3o brasileira.'
                : 'Disputes between patients and providers should preferably be resolved through mediation. MD Baise may mediate disputes but does not guarantee specific outcomes. Claims must be filed within 48 hours after the service. Consumer rights under the Consumer Protection Code (CDC) are fully preserved. For disputes not resolved through mediation, Brazilian jurisdiction applies.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '19. Suspens\u00e3o e Encerramento de Conta' : '19. Account Suspension & Termination'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'A MD Baise pode suspender ou encerrar contas por viola\u00e7\u00f5es destes Termos, incluindo: conduta profissional inadequada, avalia\u00e7\u00f5es fraudulentas, inadimpl\u00eancia, ou atividades ilegais. Usu\u00e1rios receber\u00e3o notifica\u00e7\u00e3o pr\u00e9via quando poss\u00edvel e t\u00eam direito de recurso. Ap\u00f3s o encerramento, dados pessoais ser\u00e3o retidos conforme exigido por lei e exclu\u00eddos ap\u00f3s o per\u00edodo legal de reten\u00e7\u00e3o.'
                : 'MD Baise may suspend or terminate accounts for violations of these Terms, including: unprofessional conduct, fraudulent reviews, non-payment, or illegal activities. Users will receive prior notice when possible and have the right to appeal. After termination, personal data will be retained as required by law and deleted after the legal retention period.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '20. Limita\u00e7\u00e3o de Responsabilidade' : '20. Limitation of Liability'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'A MD Baise n\u00e3o \u00e9 respons\u00e1vel por resultados m\u00e9dicos, diagn\u00f3sticos, tratamentos ou quaisquer danos decorrentes dos servi\u00e7os prestados por profissionais na Plataforma. Nossa responsabilidade total est\u00e1 limitada ao valor das taxas de servi\u00e7o pagas nos \u00faltimos 12 meses. Esta limita\u00e7\u00e3o n\u00e3o se aplica a casos de dolo ou culpa grave, conforme a legisla\u00e7\u00e3o brasileira.'
                : 'MD Baise is not liable for medical outcomes, diagnoses, treatments, or any damages arising from services provided by professionals on the Platform. Our total liability is limited to service fees paid in the last 12 months. This limitation does not apply in cases of willful misconduct or gross negligence, per Brazilian law.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '21. Indeniza\u00e7\u00e3o' : '21. Indemnification'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Voc\u00ea concorda em indenizar e isentar a MD Baise, seus diretores, funcion\u00e1rios e agentes de quaisquer reclama\u00e7\u00f5es, danos, perdas ou despesas (incluindo honor\u00e1rios advocat\u00edcios) decorrentes do seu uso da Plataforma, viola\u00e7\u00e3o destes Termos, ou viola\u00e7\u00e3o de direitos de terceiros.'
                : 'You agree to indemnify and hold harmless MD Baise, its directors, employees, and agents from any claims, damages, losses, or expenses (including legal fees) arising from your use of the Platform, violation of these Terms, or violation of third-party rights.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '22. Isen\u00e7\u00e3o de Garantias' : '22. Disclaimer of Warranties'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'A Plataforma \u00e9 fornecida "como est\u00e1" e "conforme dispon\u00edvel". N\u00e3o garantimos disponibilidade ininterrupta, aus\u00eancia de erros, precis\u00e3o das informa\u00e7\u00f5es dos profissionais, ou resultados espec\u00edficos de sa\u00fade. Em caso de emerg\u00eancia m\u00e9dica, ligue para o SAMU (192) ou dirija-se ao pronto-socorro mais pr\u00f3ximo.'
                : 'The Platform is provided "as is" and "as available." We do not guarantee uninterrupted availability, error-free operation, accuracy of provider information, or specific health outcomes. In case of medical emergency, call SAMU (192) or go to the nearest emergency room.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '23. Lei Aplic\u00e1vel e Jurisdi\u00e7\u00e3o' : '23. Governing Law & Jurisdiction'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Estes Termos s\u00e3o regidos pelas leis da Rep\u00fablica Federativa do Brasil. Fica eleito o foro da Comarca de S\u00e3o Paulo, Estado de S\u00e3o Paulo, para dirimir quaisquer quest\u00f5es oriundas destes Termos. Os direitos do consumidor previstos no C\u00f3digo de Defesa do Consumidor (Lei 8.078/1990), no Marco Civil da Internet (Lei 12.965/2014) e na LGPD (Lei 13.709/2018) s\u00e3o plenamente respeitados.'
                : 'These Terms are governed by the laws of the Federative Republic of Brazil. The courts of S\u00e3o Paulo, State of S\u00e3o Paulo, are elected to resolve any issues arising from these Terms. Consumer rights under the Consumer Protection Code (Law 8,078/1990), the Internet Civil Framework (Law 12,965/2014), and LGPD (Law 13,709/2018) are fully respected.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '24. Disposi\u00e7\u00f5es Gerais' : '24. General Provisions'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Se qualquer disposi\u00e7\u00e3o destes Termos for considerada inv\u00e1lida, as demais permanecer\u00e3o em vigor. A falha da MD Baise em exercer qualquer direito n\u00e3o constitui ren\u00fancia. Estes Termos constituem o acordo integral entre voc\u00ea e a MD Baise. N\u00e3o podemos ceder estes Termos sem seu consentimento, exceto em caso de fus\u00e3o, aquisi\u00e7\u00e3o ou venda de ativos. Eventos de for\u00e7a maior isentam ambas as partes de obriga\u00e7\u00f5es afetadas.'
                : 'If any provision of these Terms is found invalid, the remaining provisions shall remain in effect. MD Baise\'s failure to exercise any right does not constitute a waiver. These Terms constitute the entire agreement between you and MD Baise. We may not assign these Terms without your consent, except in the event of a merger, acquisition, or asset sale. Force majeure events exempt both parties from affected obligations.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '25. Verifica\u00e7\u00e3o de Credenciais' : '25. Credential Verification'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Todos os prestadores de servi\u00e7os na Medical Baise devem certificar a precis\u00e3o de suas qualifica\u00e7\u00f5es durante o cadastro. Ao se registrar como prestador de servi\u00e7os, voc\u00ea concorda que:'
                : 'All service providers on Medical Baise must certify the accuracy of their qualifications during registration. By registering as a service provider, you agree that:'}
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>{isPt ? 'A Medical Baise reserva-se o direito de solicitar documenta\u00e7\u00e3o de suporte (certificados, diplomas, t\u00edtulos, licen\u00e7as, pr\u00eamios e certifica\u00e7\u00f5es) a qualquer momento.' : 'Medical Baise reserves the right to request supporting documentation (certificates, diplomas, degrees, licenses, awards, and certifications) at any time.'}</li>
              <li>{isPt ? 'Solicita\u00e7\u00f5es de verifica\u00e7\u00e3o podem ser emitidas para verifica\u00e7\u00f5es aleat\u00f3rias de conformidade, em resposta a reclama\u00e7\u00f5es de clientes ou como parte da garantia de qualidade rotineira.' : 'Verification requests may be issued for random compliance checks, in response to client complaints, or as part of routine quality assurance.'}</li>
              <li>{isPt ? 'A falha em fornecer a documenta\u00e7\u00e3o solicitada dentro de 14 dias \u00fateis pode resultar em suspens\u00e3o ou encerramento da conta.' : 'Failure to provide requested documentation within 14 business days may result in account suspension or termination.'}</li>
              <li>{isPt ? 'Fornecer informa\u00e7\u00f5es falsas ou enganosas sobre credenciais constitui viola\u00e7\u00e3o destes Termos e pode resultar em encerramento imediato da conta e potencial a\u00e7\u00e3o legal.' : 'Providing false or misleading credential information constitutes a violation of these Terms and may result in immediate account termination and potential legal action.'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '26. Conformidade com HIPAA' : '26. HIPAA Compliance'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'A Medical Baise está comprometida com a conformidade com a Lei de Portabilidade e Responsabilidade de Seguros de Saúde (HIPAA) e regulamentos relacionados.'
                : 'Medical Baise is committed to compliance with the Health Insurance Portability and Accountability Act (HIPAA) and related regulations.'}
            </p>

            <h3 className="text-lg font-semibold mt-4 mb-2">
              {isPt ? 'Acordo de Associado de Negócios (BAA)' : 'Business Associate Agreement (BAA)'}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'A Medical Baise atua como Associado de Negócios sob o HIPAA. Celebramos Acordos de Associado de Negócios com todos os profissionais de saúde que utilizam nossa plataforma para garantir a proteção das Informações de Saúde Protegidas (PHI).'
                : 'Medical Baise acts as a Business Associate under HIPAA. We enter into Business Associate Agreements with all healthcare providers who use our platform to ensure the protection of Protected Health Information (PHI).'}
            </p>

            <h3 className="text-lg font-semibold mt-4 mb-2">
              {isPt ? 'Informações de Saúde Protegidas (PHI)' : 'Protected Health Information (PHI)'}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'PHI inclui qualquer informação de saúde individualmente identificável, incluindo:'
                : 'PHI includes any individually identifiable health information, including:'}
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>{isPt ? 'Nomes de pacientes, endereços, datas de nascimento e números de CPF' : 'Patient names, addresses, dates of birth, and Social Security numbers'}</li>
              <li>{isPt ? 'Prontuários médicos, diagnósticos, planos de tratamento e prescrições' : 'Medical records, diagnoses, treatment plans, and prescriptions'}</li>
              <li>{isPt ? 'Informações de seguro e registros de faturamento' : 'Insurance information and billing records'}</li>
              <li>{isPt ? 'Qualquer informação que possa identificar um paciente em conexão com sua condição de saúde' : 'Any information that can identify a patient in connection with their health condition'}</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4 mb-2">
              {isPt ? 'Segurança de Dados' : 'Data Security'}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Implementamos salvaguardas administrativas, físicas e técnicas para proteger PHI, incluindo:'
                : 'We implement administrative, physical, and technical safeguards to protect PHI, including:'}
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>{isPt ? 'Criptografia de dados em repouso e em trânsito (AES-256, TLS 1.3)' : 'Encryption of data at rest and in transit (AES-256, TLS 1.3)'}</li>
              <li>{isPt ? 'Controles de acesso baseados em função limitando o acesso a PHI a pessoal autorizado' : 'Role-based access controls limiting PHI access to authorized personnel'}</li>
              <li>{isPt ? 'Registro de auditoria de todos os acessos e modificações de PHI' : 'Audit logging of all PHI access and modifications'}</li>
              <li>{isPt ? 'Avaliações de segurança regulares e testes de vulnerabilidade' : 'Regular security assessments and vulnerability testing'}</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4 mb-2">
              {isPt ? 'Direitos do Paciente' : 'Patient Rights'}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Sob o HIPAA, os pacientes têm o direito de:'
                : 'Under HIPAA, patients have the right to:'}
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>{isPt ? 'Acessar suas informações de saúde' : 'Access their health information'}</li>
              <li>{isPt ? 'Solicitar alterações em seus registros' : 'Request amendments to their records'}</li>
              <li>{isPt ? 'Receber um registro de divulgações' : 'Receive an accounting of disclosures'}</li>
              <li>{isPt ? 'Solicitar restrições sobre certos usos de seu PHI' : 'Request restrictions on certain uses of their PHI'}</li>
              <li>{isPt ? 'Registrar reclamações sobre práticas de privacidade' : 'File complaints regarding privacy practices'}</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4 mb-2">
              {isPt ? 'Notificação de Violação' : 'Breach Notification'}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Em caso de violação de PHI não protegida, a Medical Baise notificará os indivíduos afetados dentro de 60 dias, o Departamento de Saúde e Serviços Humanos e, se aplicável, a mídia, em conformidade com as Regras de Notificação de Violação do HIPAA.'
                : 'In the event of a breach of unsecured PHI, Medical Baise will notify affected individuals within 60 days, the Department of Health and Human Services, and, if applicable, the media, in accordance with HIPAA Breach Notification Rules.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '27. Isenção de Responsabilidade da Plataforma' : '27. Platform Disclaimer'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Medical Baise é um marketplace que conecta pacientes a profissionais de saúde. A Medical Baise não é um prestador de serviços de saúde, hospital ou clínica. Nós não:'
                : 'Medical Baise is a marketplace that connects patients with healthcare professionals. Medical Baise is not a healthcare provider, hospital, or clinic. We do not:'}
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>{isPt ? 'Fornecemos conselhos médicos, diagnósticos ou tratamentos' : 'Provide medical advice, diagnoses, or treatment'}</li>
              <li>{isPt ? 'Armazenamos Registros Eletrônicos de Saúde (EHR) ou prontuários médicos' : 'Store Electronic Health Records (EHR) or medical charts'}</li>
              <li>{isPt ? 'Processamos, armazenamos ou gerenciamos prescrições' : 'Process, store, or manage prescriptions'}</li>
              <li>{isPt ? 'Atuamos como entidade coberta pelo HIPAA' : 'Act as a covered entity under HIPAA'}</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              {isPt
                ? 'Os profissionais de saúde nesta plataforma são profissionais independentes responsáveis pela sua própria conformidade com o HIPAA, seguro de responsabilidade civil médica e licenciamento médico. A Medical Baise recomenda que todos os profissionais de saúde utilizem um sistema de prontuário eletrônico (EHR) em conformidade com o HIPAA para registros de pacientes.'
                : 'Healthcare providers on this platform are independent professionals responsible for their own HIPAA compliance, malpractice insurance, and medical licensing. Medical Baise recommends that all healthcare providers use a HIPAA-compliant EHR system for patient records.'}
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              {isPt
                ? 'Para provedores que tratam Informações de Saúde Protegidas (PHI) por meio desta plataforma, a Medical Baise oferece um Acordo de Associado de Negócios (BAA) mediante solicitação. Entre em contato com suporte@medicalbaise.com para solicitar um BAA.'
                : 'For providers handling Protected Health Information (PHI) through this platform, Medical Baise offers a Business Associate Agreement (BAA) upon request. Contact support@medicalbaise.com to request a BAA.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '28. Contato' : '28. Contact Information'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Para d\u00favidas sobre estes Termos de Servi\u00e7o, entre em contato:'
                : 'For questions about these Terms of Service, contact us:'}
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>{isPt ? 'E-mail: suporte@medicalbaise.com' : 'Email: suporte@medicalbaise.com'}</li>
              <li>{isPt ? 'Site: medicalbaise.com' : 'Website: medicalbaise.com'}</li>
            </ul>
          </section>

        </div>
      </div>
    </AppLayout>
  );
}
