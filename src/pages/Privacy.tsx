import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { getLegalProfile } from './legalProfile';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card/40 p-5">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      <div className="space-y-3 text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-6 space-y-1">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function Privacy() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const profile = getLegalProfile();
  const isPt = (i18n.language || '').startsWith('pt');

  return (
    <AppLayout>
      <Helmet>
        <title>{t('legal.privacyTitle', 'Privacy Policy')} - {profile.brandName}</title>
      </Helmet>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back', 'Back')}
        </Button>

        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            {isPt ? 'Privacidade LGPD - Brasil primeiro' : 'LGPD Privacy - Brazil first'}
          </p>
          <h1 className="mt-2 text-3xl font-bold">
            {isPt ? 'Politica de Privacidade e Protecao de Dados' : 'Privacy Policy and Data Protection Statement'}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {isPt ? 'Ultima atualizacao: 7 de julho de 2026. Versao 2026.07.' : 'Last updated: July 7, 2026. Version 2026.07.'}
          </p>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-5">
          <Section title={isPt ? '1. Quem somos e como esta politica se aplica' : '1. Who We Are and How This Policy Applies'}>
            <p>
              {isPt
                ? `${profile.brandName} e ${profile.marketplacePt}. Esta politica se aplica ao site, portal, web app, app iOS/Apple, app Android/Google Play, suporte, mensagens, pagamentos, assinaturas, arquivos, recursos de IA e qualquer area autenticada da plataforma.`
                : `${profile.brandName} is ${profile.marketplaceEn}. This policy applies to the website, portal, web app, iOS/Apple app, Android/Google Play app, support, messaging, payments, subscriptions, files, AI features, and any authenticated platform area.`}
            </p>
            <p>
              {isPt
                ? 'Tratamos a LGPD como padrao base. Onde a plataforma for lancada fora do Brasil, aplicaremos camadas adicionais como GDPR/UK GDPR, CCPA/CPRA, regras de lojas de apps e exigencias locais.'
                : 'We treat LGPD as the baseline standard. Where the platform launches outside Brazil, we apply additional layers such as GDPR/UK GDPR, CCPA/CPRA, app store rules, and local requirements.'}
            </p>
          </Section>

          <Section title={isPt ? '2. Dados que coletamos' : '2. Data We Collect'}>
            <BulletList
              items={
                isPt
                  ? [
                      'Identidade e contato: nome, e-mail, telefone, CPF/CNPJ quando aplicavel, endereco, foto, idioma, cidade, estado e pais.',
                      `Dados especificos da marca: ${profile.sensitiveDataPt}.`,
                      'Conta e seguranca: login, convites, redefinicoes de senha, MFA, sessoes, dispositivos, eventos de autenticacao, tentativas falhas, bloqueios, papeis e permissoes.',
                      'Pagamentos e assinaturas: historico de compras, status de pagamento, reembolsos, chargebacks, recibos, tokens de processadores e referencias de transacao. Nao armazenamos numero completo de cartao.',
                      'Comunicacoes: mensagens no app, e-mails, SMS, WhatsApp, chamadas, suporte, anexos, consentimentos e preferencias.',
                      'Uso tecnico: IP, navegador, sistema operacional, identificadores, cookies, analytics, logs, erros, performance, cache, auditoria e eventos antifraude.',
                      'Dados de terceiros: provedores de pagamento, provedores de identidade, profissionais, parceiros, fontes publicas, registros profissionais e autoridades quando necessario.',
                    ]
                  : [
                      'Identity and contact: name, email, phone, CPF/CNPJ where applicable, address, photo, language, city, state, and country.',
                      `Brand-specific data: ${profile.sensitiveDataEn}.`,
                      'Account and security: login, invites, password resets, MFA, sessions, devices, authentication events, failed attempts, lockouts, roles, and permissions.',
                      'Payments and subscriptions: purchase history, payment status, refunds, chargebacks, receipts, processor tokens, and transaction references. We do not store full card numbers.',
                      'Communications: in-app messages, email, SMS, WhatsApp, calls, support, attachments, consents, and preferences.',
                      'Technical usage: IP, browser, operating system, identifiers, cookies, analytics, logs, errors, performance, cache, audit, and anti-fraud events.',
                      'Third-party data: payment providers, identity providers, professionals, partners, public sources, professional registries, and authorities where needed.',
                    ]
              }
            />
          </Section>

          <Section title={isPt ? '3. Como usamos dados' : '3. How We Use Data'}>
            <BulletList
              items={
                isPt
                  ? [
                      'Operar a plataforma, contas, perfis, busca, agendamento, mensagens, pagamentos, avaliacoes, suporte e recursos do portal.',
                      'Verificar identidade, elegibilidade, credenciais profissionais, permissao de acesso, relacionamento entre usuarios e prevencao de fraude.',
                      'Processar pagamentos, assinaturas, reembolsos, disputas, chargebacks, recibos e obrigacoes fiscais.',
                      'Aplicar seguranca: RLS, politicas de armazenamento, controles por papel, segregacao por usuario, verificacao de sessao, cache seguro, auditoria e resposta a incidentes.',
                      'Melhorar qualidade, acessibilidade, localizacao, traducoes, desempenho, confiabilidade, analytics e experiencia do usuario.',
                      'Cumprir leis, ordens, regulamentos profissionais, direitos do consumidor, LGPD, regras das lojas de apps e solicitacoes validas de autoridades.',
                    ]
                  : [
                      'Operate the platform, accounts, profiles, search, scheduling, messaging, payments, reviews, support, and portal features.',
                      'Verify identity, eligibility, professional credentials, access permission, user relationships, and fraud prevention.',
                      'Process payments, subscriptions, refunds, disputes, chargebacks, receipts, and tax obligations.',
                      'Apply security: RLS, storage policies, role controls, user segregation, session verification, secure caching, audit, and incident response.',
                      'Improve quality, accessibility, localization, translations, performance, reliability, analytics, and user experience.',
                      'Comply with laws, orders, professional rules, consumer rights, LGPD, app store rules, and valid authority requests.',
                    ]
              }
            />
          </Section>

          <Section title={isPt ? '4. Bases legais LGPD' : '4. LGPD Legal Bases'}>
            <BulletList
              items={
                isPt
                  ? [
                      'Execucao de contrato ou procedimentos preliminares solicitados por voce.',
                      'Cumprimento de obrigacao legal ou regulatoria.',
                      'Consentimento, inclusive para marketing, cookies opcionais, permissoes de app e dados sensiveis quando exigido.',
                      'Legitimo interesse para seguranca, prevencao de fraude, melhoria, suporte, auditoria e operacao, sempre balanceado com seus direitos.',
                      'Exercicio regular de direitos em processos judiciais, administrativos ou arbitrais.',
                      'Protecao da vida, tutela da saude ou protecao do credito quando aplicavel ao contexto.',
                    ]
                  : [
                      'Performance of a contract or pre-contract steps requested by you.',
                      'Compliance with a legal or regulatory obligation.',
                      'Consent, including for marketing, optional cookies, app permissions, and sensitive data where required.',
                      'Legitimate interests in security, fraud prevention, improvement, support, audit, and operations, balanced against your rights.',
                      'Regular exercise of rights in judicial, administrative, or arbitration proceedings.',
                      'Protection of life, health protection, or credit protection where applicable to the context.',
                    ]
              }
            />
          </Section>

          <Section title={isPt ? '5. Compartilhamento' : '5. Sharing'}>
            <p>
              {isPt
                ? 'Nao vendemos dados pessoais. Compartilhamos somente quando necessario para operar, proteger, cumprir a lei ou entregar o servico solicitado.'
                : 'We do not sell personal data. We share only where needed to operate, protect, comply with law, or deliver the requested service.'}
            </p>
            <BulletList
              items={
                isPt
                  ? [
                      'Com usuarios e profissionais envolvidos na transacao, somente conforme permissao, papel, finalidade e visibilidade da plataforma.',
                      'Com provedores de pagamento, hospedagem, banco de dados, e-mail, SMS, WhatsApp, analytics, mapas, suporte, seguranca, armazenamento e automacao.',
                      'Com consultores, auditores, advogados, contadores, seguradoras, parceiros e autoridades quando necessario e permitido.',
                      'Com lojas de apps, provedores de identidade e sistemas operacionais para seguranca, login, notificacoes, compras ou permissao de dispositivo.',
                      'Em transferencia societaria, fusao, aquisicao ou reorganizacao, sob protecoes equivalentes.',
                    ]
                  : [
                      'With users and professionals involved in the transaction, only according to permission, role, purpose, and platform visibility.',
                      'With payment, hosting, database, email, SMS, WhatsApp, analytics, maps, support, security, storage, and automation providers.',
                      'With advisers, auditors, lawyers, accountants, insurers, partners, and authorities where needed and permitted.',
                      'With app stores, identity providers, and operating systems for security, login, notifications, purchases, or device permission.',
                      'In a corporate transfer, merger, acquisition, or reorganization, under equivalent protections.',
                    ]
              }
            />
          </Section>

          <Section title={isPt ? '6. Seguranca, RLS, limites de taxa, cache e limpeza de dados' : '6. Security, RLS, Rate Limits, Caching, and Scrubbing'}>
            <BulletList
              items={
                isPt
                  ? [
                      'Supabase e bancos similares devem manter RLS habilitado em tabelas privadas, com politicas por usuario, papel, equipe, dono, relacionamento e finalidade.',
                      'Service-role keys, secrets, tokens e variaveis sensiveis nunca devem ser expostos ao navegador, app cliente, logs ou screenshots.',
                      'Dados privados em portal, API ou app devem usar Cache-Control: no-store ou cache segmentado por usuario e invalido em logout, troca de papel, atualizacao sensivel ou revogacao.',
                      'Login, cadastro, redefinicao de senha, convite, MFA, upload, exportacao, pagamento, webhook, mensagens, IA, e-mail, SMS, API e outras rotas caras ou sujeitas a abuso devem ter limites de taxa, quotas, filas, desafios, bloqueios temporarios ou suspensao conforme o risco.',
                      'Logs, traces de IA, analytics, ferramentas de suporte, dumps, relatorios e screenshots devem ser scrubbed ou mascarados antes de armazenamento, revisao ou compartilhamento.',
                      'Mensagens de erro de login devem ser genericas e nao revelar qual credencial falhou nem se uma conta existe.',
                      'Testes de seguranca, revisoes de RLS, verificacao de buckets, checagem de cache, varredura de segredos e validacao de permissao devem ocorrer antes de lancamentos e em ciclos recorrentes.',
                    ]
                  : [
                      'Supabase and similar databases must keep RLS enabled on private tables, with policies by user, role, team, owner, relationship, and purpose.',
                      'Service-role keys, secrets, tokens, and sensitive variables must never be exposed to the browser, client app, logs, or screenshots.',
                      'Private portal, API, or app data must use Cache-Control: no-store or user-segmented caching and invalidate on logout, role change, sensitive update, or revocation.',
                      'Login, signup, password reset, invite, MFA, upload, export, payment, webhook, messaging, AI, email, SMS, API, and other expensive or abuse-prone routes must have rate limits, quotas, queues, challenges, temporary blocks, or suspension according to risk.',
                      'Logs, AI traces, analytics, support tools, dumps, reports, and screenshots must be scrubbed or masked before storage, review, or sharing.',
                      'Login error messages must be generic and must not reveal which credential failed or whether an account exists.',
                      'Security testing, RLS review, bucket verification, cache checks, secret scanning, and permission validation must occur before launches and on recurring cycles.',
                    ]
              }
            />
          </Section>

          <Section title={isPt ? '7. Retencao, exclusao e direitos LGPD' : '7. Retention, Deletion, and LGPD Rights'}>
            <p>
              {isPt
                ? 'Retemos dados pelo tempo necessario para fornecer o servico, cumprir leis, resolver disputas, prevenir fraude, manter registros fiscais, preservar seguranca e respeitar obrigacoes profissionais. Depois, dados devem ser excluidos, anonimizados ou arquivados com acesso restrito.'
                : 'We retain data as long as needed to provide the service, comply with law, resolve disputes, prevent fraud, maintain tax records, preserve security, and respect professional obligations. After that, data should be deleted, anonymized, or archived with restricted access.'}
            </p>
            <BulletList
              items={
                isPt
                  ? [
                      'Voce pode solicitar confirmacao de tratamento, acesso, correcao, anonimizacao, bloqueio, exclusao, portabilidade, informacao sobre compartilhamento, revisao de decisoes automatizadas e revogacao de consentimento.',
                      'Exclusao de conta e dados pode ser limitada por retencoes legais, fiscais, antifraude, seguranca, chargeback, disputa, auditoria e registros profissionais.',
                      `Para exercer direitos, contate ${profile.privacyEmail}. Voce tambem pode apresentar reclamacao a ANPD.`,
                    ]
                  : [
                      'You may request confirmation of processing, access, correction, anonymization, blocking, deletion, portability, information about sharing, review of automated decisions, and consent revocation.',
                      'Account and data deletion may be limited by legal, tax, anti-fraud, security, chargeback, dispute, audit, and professional-record retention.',
                      `To exercise rights, contact ${profile.privacyEmail}. You may also complain to the ANPD.`,
                    ]
              }
            />
          </Section>

          <Section title={isPt ? '8. Cookies, permissoes de app e transferencias internacionais' : '8. Cookies, App Permissions, and International Transfers'}>
            <BulletList
              items={
                isPt
                  ? [
                      'Cookies essenciais operam login, seguranca, preferencia e funcionalidade. Cookies opcionais de analytics, marketing ou personalizacao devem respeitar consentimento quando exigido.',
                      'Permissoes de app como camera, microfone, fotos, arquivos, notificacoes, localizacao e biometria sao solicitadas no contexto da funcionalidade e podem ser controladas no dispositivo.',
                      'Dados podem ser processados fora do Brasil por provedores de nuvem e infraestrutura. Usamos contratos, controles de acesso e medidas tecnicas para proteger transferencias internacionais.',
                    ]
                  : [
                      'Essential cookies operate login, security, preference, and functionality. Optional analytics, marketing, or personalization cookies must respect consent where required.',
                      'App permissions such as camera, microphone, photos, files, notifications, location, and biometrics are requested in context and may be controlled on the device.',
                      'Data may be processed outside Brazil by cloud and infrastructure providers. We use contracts, access controls, and technical measures to protect international transfers.',
                    ]
              }
            />
          </Section>

          <Section title={isPt ? '9. Incidentes e contato' : '9. Incidents and Contact'}>
            <p>
              {isPt
                ? 'Se identificarmos incidente de seguranca com risco relevante a dados pessoais, avaliaremos impacto, conteremos o evento, registraremos evidencias, comunicaremos autoridades e titulares quando exigido, e ajustaremos controles para reduzir recorrencia.'
                : 'If we identify a security incident with relevant risk to personal data, we assess impact, contain the event, preserve evidence, notify authorities and data subjects where required, and adjust controls to reduce recurrence.'}
            </p>
            <BulletList
              items={
                isPt
                  ? [
                      `Suporte: ${profile.supportEmail}`,
                      `Privacidade/LGPD: ${profile.privacyEmail}`,
                      `Site: ${profile.website}`,
                    ]
                  : [
                      `Support: ${profile.supportEmail}`,
                      `Privacy/LGPD: ${profile.privacyEmail}`,
                      `Website: ${profile.website}`,
                    ]
              }
            />
          </Section>
        </div>
      </div>
    </AppLayout>
  );
}
