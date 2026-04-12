import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function Privacy() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isPt = (i18n.language || '').startsWith('pt') || (i18n.language || '').startsWith('es');

  return (
    <AppLayout>
      <Helmet>
        <title>{t('legal.privacyTitle', 'Privacy Policy')} - MD Baise</title>
      </Helmet>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back', 'Back')}
        </Button>

        <h1 className="text-3xl font-bold mb-6">
          {isPt ? 'Pol\u00edtica de Privacidade' : 'Privacy Policy'}
        </h1>
        <p className="text-muted-foreground mb-8">
          {isPt ? '\u00daltima atualiza\u00e7\u00e3o: 12 de abril de 2026' : 'Last updated: April 12, 2026'}
        </p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '1. Introdu\u00e7\u00e3o' : '1. Introduction'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'A MD Baise ("n\u00f3s", "nosso") \u00e9 um marketplace de sa\u00fade que conecta pacientes a profissionais de sa\u00fade no Brasil. Esta Pol\u00edtica de Privacidade descreve como coletamos, usamos, compartilhamos e protegemos suas informa\u00e7\u00f5es pessoais em conformidade com a Lei Geral de Prote\u00e7\u00e3o de Dados (LGPD \u2014 Lei 13.709/2018) e demais legisla\u00e7\u00f5es aplic\u00e1veis. A MD Baise atua como Controladora de Dados para os dados pessoais coletados atrav\u00e9s da Plataforma.'
                : 'MD Baise ("we", "our") is a healthcare marketplace connecting patients with healthcare professionals in Brazil. This Privacy Policy describes how we collect, use, share, and protect your personal information in compliance with the Brazilian General Data Protection Law (LGPD \u2014 Law 13,709/2018) and other applicable legislation. MD Baise acts as Data Controller for personal data collected through the Platform.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '2. Defini\u00e7\u00f5es' : '2. Key Definitions'}
            </h2>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>{isPt ? '"Dados Pessoais": qualquer informa\u00e7\u00e3o relacionada a uma pessoa natural identificada ou identific\u00e1vel.' : '"Personal Data": any information related to an identified or identifiable natural person.'}</li>
              <li>{isPt ? '"Dados Sens\u00edveis": dados de sa\u00fade, dados biom\u00e9tricos e quaisquer dados que revelem condi\u00e7\u00f5es m\u00e9dicas.' : '"Sensitive Data": health data, biometric data, and any data revealing medical conditions.'}</li>
              <li>{isPt ? '"Controlador": MD Baise, respons\u00e1vel pelas decis\u00f5es sobre o tratamento de dados pessoais.' : '"Controller": MD Baise, responsible for decisions regarding personal data processing.'}</li>
              <li>{isPt ? '"Operador": terceiros que processam dados em nome da MD Baise (ex: Stripe, provedores de hospedagem).' : '"Processor": third parties that process data on behalf of MD Baise (e.g., Stripe, hosting providers).'}</li>
              <li>{isPt ? '"ANPD": Autoridade Nacional de Prote\u00e7\u00e3o de Dados, \u00f3rg\u00e3o regulador da LGPD.' : '"ANPD": National Data Protection Authority, the LGPD regulatory body.'}</li>
              <li>{isPt ? '"Titular": voc\u00ea, a pessoa a quem os dados pessoais se referem.' : '"Data Subject": you, the person to whom the personal data relates.'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '3. Informa\u00e7\u00f5es que Coletamos' : '3. Information We Collect'}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-2">
              {isPt ? 'Coletamos as seguintes categorias de informa\u00e7\u00f5es:' : 'We collect the following categories of information:'}
            </p>
            <p className="text-muted-foreground leading-relaxed font-medium mt-3">
              {isPt ? 'Informa\u00e7\u00f5es fornecidas por voc\u00ea:' : 'Information you provide:'}
            </p>
            <ul className="list-disc pl-6 mt-1 space-y-1 text-muted-foreground">
              <li>{isPt ? 'Nome, e-mail, telefone, CPF, endere\u00e7o, foto de perfil' : 'Name, email, phone, CPF, address, profile photo'}</li>
              <li>{isPt ? 'Informa\u00e7\u00f5es de pagamento (processadas pelo Stripe \u2014 n\u00e3o armazenamos dados de cart\u00e3o)' : 'Payment information (processed by Stripe \u2014 we do not store card data)'}</li>
              <li>{isPt ? 'Avalia\u00e7\u00f5es, coment\u00e1rios e conte\u00fado publicado' : 'Reviews, comments, and published content'}</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed font-medium mt-3">
              {isPt ? 'Para profissionais de sa\u00fade:' : 'For healthcare providers:'}
            </p>
            <ul className="list-disc pl-6 mt-1 space-y-1 text-muted-foreground">
              <li>{isPt ? 'N\u00famero do CRM, especialidades, forma\u00e7\u00e3o acad\u00eamica' : 'CRM number, specialties, academic background'}</li>
              <li>{isPt ? 'Credenciais profissionais, certificados e licen\u00e7as' : 'Professional credentials, certificates, and licenses'}</li>
              <li>{isPt ? 'Informa\u00e7\u00f5es do consult\u00f3rio e dados banc\u00e1rios para pagamentos' : 'Office information and banking details for payouts'}</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed font-medium mt-3">
              {isPt ? 'Coletadas automaticamente:' : 'Automatically collected:'}
            </p>
            <ul className="list-disc pl-6 mt-1 space-y-1 text-muted-foreground">
              <li>{isPt ? 'Endere\u00e7o IP, tipo de navegador, sistema operacional' : 'IP address, browser type, operating system'}</li>
              <li>{isPt ? 'Padr\u00f5es de uso, p\u00e1ginas visitadas, tempo de sess\u00e3o' : 'Usage patterns, pages visited, session duration'}</li>
              <li>{isPt ? 'Dados de geolocaliza\u00e7\u00e3o (com seu consentimento)' : 'Geolocation data (with your consent)'}</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed font-medium mt-3">
              {isPt ? 'De terceiros:' : 'From third parties:'}
            </p>
            <ul className="list-disc pl-6 mt-1 space-y-1 text-muted-foreground">
              <li>{isPt ? 'Google OAuth (nome, e-mail, foto do perfil)' : 'Google OAuth (name, email, profile photo)'}</li>
              <li>{isPt ? 'Stripe (status de pagamento, confirma\u00e7\u00f5es de transa\u00e7\u00e3o)' : 'Stripe (payment status, transaction confirmations)'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '4. Dados de Sa\u00fade Sens\u00edveis' : '4. Sensitive Health Data'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Dados de sa\u00fade s\u00e3o classificados como dados pessoais sens\u00edveis pela LGPD (Art. 11) e recebem prote\u00e7\u00e3o refor\u00e7ada. Coletamos dados de sa\u00fade apenas quando estritamente necess\u00e1rio para a presta\u00e7\u00e3o dos servi\u00e7os e com seu consentimento expl\u00edcito. Aplicamos o princ\u00edpio de minimiza\u00e7\u00e3o de dados \u2014 coletamos apenas o m\u00ednimo necess\u00e1rio. O compartilhamento de dados de sa\u00fade entre pacientes e profissionais ocorre sob sigilo m\u00e9dico, protegido pelo C\u00f3digo de \u00c9tica M\u00e9dica e pela LGPD.'
                : 'Health data is classified as sensitive personal data under LGPD (Art. 11) and receives enhanced protection. We collect health data only when strictly necessary for service provision and with your explicit consent. We apply the data minimization principle \u2014 collecting only what is necessary. Health data sharing between patients and providers occurs under medical confidentiality, protected by the Medical Ethics Code and LGPD.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '5. Como Usamos Suas Informa\u00e7\u00f5es' : '5. How We Use Your Information'}
            </h2>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>{isPt ? 'Presta\u00e7\u00e3o e melhoria dos servi\u00e7os da Plataforma' : 'Providing and improving Platform services'}</li>
              <li>{isPt ? 'Agendamento e gerenciamento de consultas' : 'Scheduling and managing consultations'}</li>
              <li>{isPt ? 'Processamento de pagamentos e faturamento' : 'Payment processing and billing'}</li>
              <li>{isPt ? 'Verifica\u00e7\u00e3o de identidade e credenciais (CRM)' : 'Identity and credential verification (CRM)'}</li>
              <li>{isPt ? 'Comunica\u00e7\u00f5es sobre servi\u00e7os, atualiza\u00e7\u00f5es e seguran\u00e7a' : 'Communications about services, updates, and security'}</li>
              <li>{isPt ? 'Preven\u00e7\u00e3o de fraudes e garantia da seguran\u00e7a da Plataforma' : 'Fraud prevention and Platform security'}</li>
              <li>{isPt ? 'Cumprimento de obriga\u00e7\u00f5es legais e regulat\u00f3rias' : 'Compliance with legal and regulatory obligations'}</li>
              <li>{isPt ? 'An\u00e1lises agregadas e an\u00f4nimas para melhoria da experi\u00eancia' : 'Aggregated and anonymous analytics for experience improvement'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '6. Base Legal para Tratamento (LGPD)' : '6. Legal Basis for Processing (LGPD)'}
            </h2>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>{isPt ? 'Consentimento do titular (Art. 7\u00ba, I) \u2014 para dados sens\u00edveis e marketing' : 'Data subject consent (Art. 7, I) \u2014 for sensitive data and marketing'}</li>
              <li>{isPt ? 'Execu\u00e7\u00e3o de contrato (Art. 7\u00ba, V) \u2014 para presta\u00e7\u00e3o dos servi\u00e7os' : 'Contract performance (Art. 7, V) \u2014 for service provision'}</li>
              <li>{isPt ? 'Leg\u00edtimo interesse (Art. 7\u00ba, IX) \u2014 para seguran\u00e7a e preven\u00e7\u00e3o de fraudes' : 'Legitimate interest (Art. 7, IX) \u2014 for security and fraud prevention'}</li>
              <li>{isPt ? 'Obriga\u00e7\u00e3o legal (Art. 7\u00ba, II) \u2014 para cumprimento de leis e regulamentos' : 'Legal obligation (Art. 7, II) \u2014 for compliance with laws and regulations'}</li>
              <li>{isPt ? 'Prote\u00e7\u00e3o da vida (Art. 7\u00ba, VII) \u2014 em situa\u00e7\u00f5es de emerg\u00eancia m\u00e9dica' : 'Protection of life (Art. 7, VII) \u2014 in medical emergency situations'}</li>
              <li>{isPt ? 'Tutela da sa\u00fade (Art. 7\u00ba, VIII) \u2014 quando necess\u00e1rio para procedimentos de sa\u00fade' : 'Health protection (Art. 7, VIII) \u2014 when necessary for health procedures'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '7. Compartilhamento de Informa\u00e7\u00f5es' : '7. How We Share Your Information'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'N\u00c3O vendemos seus dados pessoais a terceiros. Compartilhamos informa\u00e7\u00f5es apenas nas seguintes situa\u00e7\u00f5es:'
                : 'We do NOT sell your personal data to third parties. We share information only in the following situations:'}
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>{isPt ? 'Com profissionais de sa\u00fade: para agendamento e presta\u00e7\u00e3o de servi\u00e7os' : 'With healthcare providers: for scheduling and service delivery'}</li>
              <li>{isPt ? 'Com processadores de pagamento (Stripe): para processar transa\u00e7\u00f5es' : 'With payment processors (Stripe): to process transactions'}</li>
              <li>{isPt ? 'Com autoridades legais: quando exigido por lei ou ordem judicial' : 'With legal authorities: when required by law or court order'}</li>
              <li>{isPt ? 'Com provedores de an\u00e1lise: dados agregados e anonimizados apenas' : 'With analytics providers: aggregated and anonymized data only'}</li>
              <li>{isPt ? 'Perfis p\u00fablicos: informa\u00e7\u00f5es que voc\u00ea torna p\u00fablicas s\u00e3o vis\u00edveis na Plataforma' : 'Public profiles: information you make public is visible on the Platform'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '8. Cookies e Tecnologias de Rastreamento' : '8. Cookies & Tracking Technologies'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Utilizamos cookies e tecnologias semelhantes para:'
                : 'We use cookies and similar technologies to:'}
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>{isPt ? 'Cookies essenciais: autentica\u00e7\u00e3o, seguran\u00e7a e funcionalidade b\u00e1sica (obrigat\u00f3rios)' : 'Essential cookies: authentication, security, and basic functionality (required)'}</li>
              <li>{isPt ? 'Cookies de an\u00e1lise: melhoria da experi\u00eancia do usu\u00e1rio (opcionais)' : 'Analytics cookies: user experience improvement (optional)'}</li>
              <li>{isPt ? 'Cookies de prefer\u00eancia: idioma, tema e configura\u00e7\u00f5es (opcionais)' : 'Preference cookies: language, theme, and settings (optional)'}</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              {isPt
                ? 'Voc\u00ea pode controlar cookies atrav\u00e9s das configura\u00e7\u00f5es do seu navegador. Desativar cookies essenciais pode afetar a funcionalidade da Plataforma.'
                : 'You can control cookies through your browser settings. Disabling essential cookies may affect Platform functionality.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '9. Seguran\u00e7a dos Dados' : '9. Data Security'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Implementamos medidas t\u00e9cnicas e organizacionais de n\u00edvel m\u00e9dico para proteger seus dados:'
                : 'We implement healthcare-grade technical and organizational measures to protect your data:'}
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>{isPt ? 'Criptografia em tr\u00e2nsito (TLS/SSL) e em repouso (AES-256)' : 'Encryption in transit (TLS/SSL) and at rest (AES-256)'}</li>
              <li>{isPt ? 'Controle de acesso baseado em fun\u00e7\u00f5es (RBAC)' : 'Role-based access control (RBAC)'}</li>
              <li>{isPt ? 'Monitoramento cont\u00ednuo de seguran\u00e7a e detec\u00e7\u00e3o de amea\u00e7as' : 'Continuous security monitoring and threat detection'}</li>
              <li>{isPt ? 'Auditorias de seguran\u00e7a regulares' : 'Regular security audits'}</li>
              <li>{isPt ? 'Procedimentos de resposta a incidentes' : 'Incident response procedures'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '10. Reten\u00e7\u00e3o de Dados' : '10. Data Retention'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Retemos seus dados pessoais enquanto sua conta estiver ativa ou conforme necess\u00e1rio para prestar servi\u00e7os. Ap\u00f3s exclus\u00e3o da conta, dados s\u00e3o removidos em at\u00e9 30 dias, exceto quando a reten\u00e7\u00e3o for exigida por lei. Registros m\u00e9dicos s\u00e3o retidos por no m\u00ednimo 20 anos conforme exig\u00eancia do CFM. Dados financeiros s\u00e3o retidos por 5 anos para conformidade fiscal.'
                : 'We retain your personal data while your account is active or as needed to provide services. After account deletion, data is removed within 30 days, except when retention is required by law. Medical records are retained for a minimum of 20 years per CFM requirements. Financial data is retained for 5 years for tax compliance.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '11. Seus Direitos sob a LGPD' : '11. Your Rights Under LGPD'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Conforme a LGPD, voc\u00ea tem os seguintes direitos em rela\u00e7\u00e3o aos seus dados pessoais:'
                : 'Under LGPD, you have the following rights regarding your personal data:'}
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>{isPt ? 'Confirma\u00e7\u00e3o da exist\u00eancia de tratamento e acesso aos seus dados' : 'Confirmation of data processing and access to your data'}</li>
              <li>{isPt ? 'Corre\u00e7\u00e3o de dados incompletos, inexatos ou desatualizados' : 'Correction of incomplete, inaccurate, or outdated data'}</li>
              <li>{isPt ? 'Anonimiza\u00e7\u00e3o, bloqueio ou elimina\u00e7\u00e3o de dados desnecess\u00e1rios ou excessivos' : 'Anonymization, blocking, or deletion of unnecessary or excessive data'}</li>
              <li>{isPt ? 'Portabilidade dos dados a outro fornecedor de servi\u00e7o' : 'Data portability to another service provider'}</li>
              <li>{isPt ? 'Elimina\u00e7\u00e3o dos dados tratados com consentimento' : 'Deletion of data processed with consent'}</li>
              <li>{isPt ? 'Informa\u00e7\u00e3o sobre entidades com as quais seus dados foram compartilhados' : 'Information about entities with which your data has been shared'}</li>
              <li>{isPt ? 'Informa\u00e7\u00e3o sobre a possibilidade de n\u00e3o consentir e as consequ\u00eancias' : 'Information about the possibility of not consenting and the consequences'}</li>
              <li>{isPt ? 'Revoga\u00e7\u00e3o do consentimento a qualquer momento' : 'Consent revocation at any time'}</li>
              <li>{isPt ? 'Revis\u00e3o de decis\u00f5es automatizadas' : 'Review of automated decisions'}</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              {isPt
                ? 'Para exercer seus direitos, entre em contato com nosso Encarregado de Prote\u00e7\u00e3o de Dados (DPO) no e-mail indicado abaixo.'
                : 'To exercise your rights, contact our Data Protection Officer (DPO) at the email indicated below.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '12. Privacidade de Menores' : '12. Children\'s Privacy'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'A Plataforma n\u00e3o \u00e9 destinada a menores de 18 anos. N\u00e3o coletamos intencionalmente dados de menores. Se identificarmos que coletamos dados de um menor sem consentimento parental adequado, excluiremos esses dados imediatamente.'
                : 'The Platform is not intended for persons under 18 years of age. We do not intentionally collect data from minors. If we identify that we have collected data from a minor without proper parental consent, we will delete that data immediately.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '13. Transfer\u00eancias Internacionais de Dados' : '13. International Data Transfers'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Seus dados podem ser processados em servidores localizados fora do Brasil (infraestrutura em nuvem). Garantimos que todas as transfer\u00eancias internacionais de dados s\u00e3o realizadas com salvaguardas adequadas, incluindo cl\u00e1usulas contratuais padr\u00e3o e medidas t\u00e9cnicas de prote\u00e7\u00e3o, em conformidade com a LGPD.'
                : 'Your data may be processed on servers located outside Brazil (cloud infrastructure). We ensure all international data transfers are carried out with adequate safeguards, including standard contractual clauses and technical protection measures, in compliance with LGPD.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '14. Notifica\u00e7\u00e3o de Viola\u00e7\u00e3o de Dados' : '14. Data Breach Notification'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Em caso de incidente de seguran\u00e7a que envolva dados pessoais, notificaremos a ANPD e os titulares afetados conforme exigido pela LGPD. A notifica\u00e7\u00e3o incluir\u00e1: a natureza dos dados afetados, as medidas de mitiga\u00e7\u00e3o adotadas, os riscos envolvidos e as recomenda\u00e7\u00f5es aos titulares.'
                : 'In the event of a security incident involving personal data, we will notify the ANPD and affected data subjects as required by LGPD. The notification will include: the nature of affected data, mitigation measures taken, risks involved, and recommendations to data subjects.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '15. Links de Terceiros' : '15. Third-Party Links'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'A Plataforma pode conter links para sites de terceiros. N\u00e3o somos respons\u00e1veis pelas pr\u00e1ticas de privacidade desses sites. Recomendamos que voc\u00ea leia as pol\u00edticas de privacidade de qualquer site externo que visitar.'
                : 'The Platform may contain links to third-party websites. We are not responsible for the privacy practices of those websites. We recommend that you read the privacy policies of any external website you visit.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '16. Altera\u00e7\u00f5es nesta Pol\u00edtica' : '16. Changes to This Policy'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Podemos atualizar esta Pol\u00edtica de Privacidade periodicamente. Notificaremos sobre altera\u00e7\u00f5es materiais com pelo menos 30 dias de anteced\u00eancia por e-mail ou notifica\u00e7\u00e3o na Plataforma. O uso continuado ap\u00f3s as altera\u00e7\u00f5es constitui aceita\u00e7\u00e3o da pol\u00edtica atualizada.'
                : 'We may update this Privacy Policy periodically. We will notify you of material changes at least 30 days in advance via email or Platform notification. Continued use after changes constitutes acceptance of the updated policy.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '17. Dados de Credenciais' : '17. Credential Data'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Quando voc\u00ea envia documentos de credenciais (certificados, diplomas, licen\u00e7as, etc.), processamos esses dados da seguinte forma:'
                : 'When you upload credential documents (certificates, diplomas, licenses, etc.), we process this data as follows:'}
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>{isPt ? '<strong>Armazenamento:</strong> Documentos de credenciais s\u00e3o armazenados com seguran\u00e7a com criptografia em repouso.' : '<strong>Storage:</strong> Credential documents are stored securely with encryption at rest.'}</li>
              <li>{isPt ? '<strong>Acesso:</strong> Apenas funcion\u00e1rios autorizados da Medical Baise podem acessar as credenciais enviadas para fins de verifica\u00e7\u00e3o.' : '<strong>Access:</strong> Only authorized Medical Baise staff may access uploaded credentials for verification purposes.'}</li>
              <li>{isPt ? '<strong>Reten\u00e7\u00e3o:</strong> Documentos de credenciais s\u00e3o retidos pela dura\u00e7\u00e3o de sua conta ativa mais 2 anos ap\u00f3s o encerramento da conta.' : '<strong>Retention:</strong> Credential documents are retained for the duration of your active account plus 2 years after account closure.'}</li>
              <li>{isPt ? '<strong>Exclus\u00e3o:</strong> Voc\u00ea pode solicitar a exclus\u00e3o de credenciais enviadas a qualquer momento entrando em contato com o suporte.' : '<strong>Deletion:</strong> You may request deletion of uploaded credentials at any time by contacting support.'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '18. Encarregado de Prote\u00e7\u00e3o de Dados (DPO)' : '18. Data Protection Officer (DPO)'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Nosso Encarregado de Prote\u00e7\u00e3o de Dados pode ser contatado para quest\u00f5es sobre privacidade, exerc\u00edcio de direitos ou reclama\u00e7\u00f5es:'
                : 'Our Data Protection Officer can be contacted for privacy questions, exercising rights, or complaints:'}
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>{isPt ? 'E-mail: privacidade@medicalbaise.com' : 'Email: privacidade@medicalbaise.com'}</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              {isPt
                ? 'Voc\u00ea tamb\u00e9m tem o direito de apresentar reclama\u00e7\u00e3o \u00e0 Autoridade Nacional de Prote\u00e7\u00e3o de Dados (ANPD) atrav\u00e9s do site www.gov.br/anpd.'
                : 'You also have the right to file a complaint with the National Data Protection Authority (ANPD) through www.gov.br/anpd.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '19. Conformidade com HIPAA e Proteção de PHI' : '19. HIPAA Compliance & PHI Protection'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Além das proteções da LGPD, a Medical Baise adota práticas alinhadas com a Lei de Portabilidade e Responsabilidade de Seguros de Saúde (HIPAA) para usuários e parceiros que operam em conformidade com padrões internacionais de saúde.'
                : 'In addition to LGPD protections, Medical Baise adopts practices aligned with the Health Insurance Portability and Accountability Act (HIPAA) for users and partners operating under international healthcare standards.'}
            </p>

            <h3 className="text-lg font-semibold mt-4 mb-2">
              {isPt ? 'Tratamento de Informações de Saúde Protegidas (PHI)' : 'Handling of Protected Health Information (PHI)'}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'PHI inclui qualquer informação de saúde individualmente identificável transmitida ou mantida em qualquer forma ou meio. Tratamos PHI com o mais alto nível de proteção, incluindo:'
                : 'PHI includes any individually identifiable health information transmitted or maintained in any form or medium. We treat PHI with the highest level of protection, including:'}
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>{isPt ? 'Coleta mínima necessária — coletamos apenas PHI estritamente necessário para a prestação de serviços' : 'Minimum necessary collection — we collect only PHI strictly necessary for service delivery'}</li>
              <li>{isPt ? 'Controles de acesso rigorosos — acesso a PHI restrito a pessoal autorizado com base em função' : 'Strict access controls — PHI access restricted to authorized personnel based on role'}</li>
              <li>{isPt ? 'Criptografia em trânsito e em repouso (TLS 1.3 e AES-256)' : 'Encryption in transit and at rest (TLS 1.3 and AES-256)'}</li>
              <li>{isPt ? 'Trilhas de auditoria completas de todos os acessos, modificações e divulgações de PHI' : 'Complete audit trails of all PHI access, modifications, and disclosures'}</li>
              <li>{isPt ? 'Acordos de Associado de Negócios (BAAs) com todos os subprocessadores que lidam com PHI' : 'Business Associate Agreements (BAAs) with all sub-processors handling PHI'}</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4 mb-2">
              {isPt ? 'Detecção de PHI em Comunicações' : 'PHI Detection in Communications'}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Nossa plataforma inclui mecanismos de detecção automática de PHI em mensagens e comunicações. Quando detectado, os usuários são alertados antes de enviar informações potencialmente sensíveis. Profissionais de saúde são notificados quando pacientes compartilham PHI para garantir o tratamento adequado dessas informações.'
                : 'Our platform includes automatic PHI detection mechanisms in messages and communications. When detected, users are alerted before sending potentially sensitive information. Healthcare providers are notified when patients share PHI to ensure proper handling of that information.'}
            </p>

            <h3 className="text-lg font-semibold mt-4 mb-2">
              {isPt ? 'Direitos do Paciente sob HIPAA' : 'Patient Rights Under HIPAA'}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Para usuários e contextos cobertos pelo HIPAA, os pacientes têm direitos adicionais:'
                : 'For users and contexts covered by HIPAA, patients have additional rights:'}
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>{isPt ? 'Acesso às suas informações de saúde protegidas' : 'Access to their protected health information'}</li>
              <li>{isPt ? 'Solicitar correções ou emendas ao seu PHI' : 'Request corrections or amendments to their PHI'}</li>
              <li>{isPt ? 'Obter um registro das divulgações de seu PHI' : 'Obtain an accounting of disclosures of their PHI'}</li>
              <li>{isPt ? 'Solicitar restrições sobre como seu PHI é usado ou divulgado' : 'Request restrictions on how their PHI is used or disclosed'}</li>
              <li>{isPt ? 'Receber comunicações confidenciais sobre assuntos de saúde' : 'Receive confidential communications about health matters'}</li>
              <li>{isPt ? 'Registrar reclamações sobre práticas de privacidade sem retaliação' : 'File complaints about privacy practices without retaliation'}</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4 mb-2">
              {isPt ? 'Notificação de Violação de PHI' : 'PHI Breach Notification'}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Em caso de violação de PHI não protegida, seguimos um protocolo rigoroso de notificação:'
                : 'In the event of a breach of unsecured PHI, we follow a strict notification protocol:'}
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>{isPt ? 'Notificação aos indivíduos afetados dentro de 60 dias após a descoberta da violação' : 'Notification to affected individuals within 60 days of breach discovery'}</li>
              <li>{isPt ? 'Notificação ao Departamento de Saúde e Serviços Humanos (HHS) conforme exigido' : 'Notification to the Department of Health and Human Services (HHS) as required'}</li>
              <li>{isPt ? 'Notificação à mídia para violações que afetam mais de 500 indivíduos em uma área geográfica' : 'Media notification for breaches affecting more than 500 individuals in a geographic area'}</li>
              <li>{isPt ? 'Notificação paralela à ANPD conforme exigido pela LGPD' : 'Parallel notification to ANPD as required under LGPD'}</li>
              <li>{isPt ? 'Relatório de violação interno com análise de causa raiz e ações corretivas' : 'Internal breach report with root cause analysis and corrective actions'}</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4 mb-2">
              {isPt ? 'Acordo de Associado de Negócios (BAA)' : 'Business Associate Agreement (BAA)'}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Profissionais de saúde que utilizam a plataforma Medical Baise podem solicitar a celebração de um Acordo de Associado de Negócios (BAA) para conformidade total com HIPAA. Entre em contato com privacidade@medicalbaise.com para solicitar um BAA.'
                : 'Healthcare providers using the Medical Baise platform may request to enter into a Business Associate Agreement (BAA) for full HIPAA compliance. Contact privacidade@medicalbaise.com to request a BAA.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              {isPt ? '20. Contato' : '20. Contact Information'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isPt
                ? 'Para d\u00favidas gerais sobre esta Pol\u00edtica de Privacidade:'
                : 'For general questions about this Privacy Policy:'}
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>{isPt ? 'E-mail: suporte@medicalbaise.com' : 'Email: suporte@medicalbaise.com'}</li>
              <li>{isPt ? 'Privacidade: privacidade@medicalbaise.com' : 'Privacy: privacidade@medicalbaise.com'}</li>
              <li>{isPt ? 'Site: medicalbaise.com' : 'Website: medicalbaise.com'}</li>
            </ul>
          </section>

        </div>
      </div>
    </AppLayout>
  );
}
