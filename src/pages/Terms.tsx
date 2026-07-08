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

export default function Terms() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const profile = getLegalProfile();
  const isPt = (i18n.language || '').startsWith('pt');
  const provider = isPt ? profile.providerPt : profile.providerEn;

  return (
    <AppLayout>
      <Helmet>
        <title>{t('legal.termsTitle', 'Terms of Service')} - {profile.brandName}</title>
      </Helmet>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back', 'Back')}
        </Button>

        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            {isPt ? 'Brasil primeiro - global em seguida' : 'Brazil first - global second'}
          </p>
          <h1 className="mt-2 text-3xl font-bold">
            {isPt ? 'Termos de Uso e Politica de Servico' : 'Terms of Service and Operating Policy'}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {isPt ? 'Ultima atualizacao: 7 de julho de 2026. Versao 2026.07.' : 'Last updated: July 7, 2026. Version 2026.07.'}
          </p>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-5">
          <Section title={isPt ? '1. Escopo destes termos' : '1. Scope of These Terms'}>
            <p>
              {isPt
                ? `${profile.brandName} e ${profile.marketplacePt}. Estes Termos se aplicam ao site, portal, web app, app iOS/Apple, app Android/Google Play, contas, mensagens, pagamentos, assinaturas, conteudo, suporte, APIs e recursos de IA quando oferecidos.`
                : `${profile.brandName} is ${profile.marketplaceEn}. These Terms apply to the website, portal, web app, iOS/Apple app, Android/Google Play app, accounts, messaging, payments, subscriptions, content, support, APIs, and AI features when offered.`}
            </p>
            <p>
              {isPt
                ? 'A experiencia e estruturada para o Brasil primeiro, com LGPD, Marco Civil da Internet, Codigo de Defesa do Consumidor e regras profissionais brasileiras como base. Expansoes globais recebem camadas adicionais quando uma nova jurisdicao for lancada.'
                : 'The experience is structured for Brazil first, with LGPD, the Brazilian Internet Civil Framework, the Brazilian Consumer Protection Code, and applicable Brazilian professional rules as the baseline. Global expansion receives additional jurisdiction layers as new markets launch.'}
            </p>
          </Section>

          <Section title={isPt ? '2. Papel da plataforma e limites profissionais' : '2. Platform Role and Professional Boundaries'}>
            <p>{isPt ? profile.professionalBoundaryPt : profile.professionalBoundaryEn}</p>
            {profile.emergencyEn && (
              <p className="font-semibold text-destructive">
                {isPt ? profile.emergencyPt : profile.emergencyEn}
              </p>
            )}
            <BulletList
              items={
                isPt
                  ? [
                      `O ${provider} e independente e deve manter licencas, registros, seguros e autorizacoes exigidos.`,
                      `${profile.brandName} pode verificar credenciais, mas verificacao nao e garantia, endosso ou promessa de resultado.`,
                      `${profile.brandName} pode remover, suspender ou exigir revisao adicional quando houver risco, reclamacao, fraude, conflito, credencial vencida ou violacao destes Termos.`,
                    ]
                  : [
                      `Each ${provider} is independent and must maintain required licenses, registrations, insurance, and authorizations.`,
                      `${profile.brandName} may verify credentials, but verification is not a guarantee, endorsement, or promise of outcome.`,
                      `${profile.brandName} may remove, suspend, or require additional review where there is risk, complaint, fraud, conflict, expired credential, or violation of these Terms.`,
                    ]
              }
            />
          </Section>

          <Section title={isPt ? '3. Contas, login e seguranca do usuario' : '3. Accounts, Login, and User Security'}>
            <BulletList
              items={
                isPt
                  ? [
                      'Voce deve ter pelo menos 18 anos, fornecer informacoes verdadeiras e manter sua conta, senha, dispositivos, MFA e sessoes sob controle.',
                      'Mensagens de erro de login devem ser genericas. A plataforma nao deve revelar se o e-mail, telefone, usuario, senha, convite, codigo ou existencia da conta foi o item incorreto.',
                      'Credenciais nao devem ser compartilhadas. Contas de equipe devem usar usuarios individuais, papeis, permissoes e trilhas de auditoria.',
                      'Login, cadastro, redefinicao de senha, convite, MFA, upload, exportacao, pagamento, webhook, mensagens, IA, e-mail, SMS, API e outras rotas caras ou sujeitas a abuso podem ser limitadas por taxa, bloqueadas, enfileiradas, desafiadas, suspensas ou encerradas conforme o risco.',
                    ]
                  : [
                      'You must be at least 18, provide truthful information, and keep your account, password, devices, MFA, and sessions under control.',
                      'Login error messages must be generic. The platform must not reveal whether the email, phone, username, password, invite, code, or account existence was the incorrect item.',
                      'Credentials must not be shared. Team accounts must use individual users, roles, permissions, and audit trails.',
                      'Login, signup, password reset, invite, MFA, upload, export, payment, webhook, messaging, AI, email, SMS, API, and other expensive or abuse-prone routes may be rate-limited, blocked, queued, challenged, suspended, or terminated according to risk.',
                    ]
              }
            />
          </Section>

          <Section title={isPt ? '4. Pagamentos, assinaturas, cancelamentos e reembolsos' : '4. Payments, Subscriptions, Cancellations, and Refunds'}>
            <BulletList
              items={
                isPt
                  ? [
                      'Precos, impostos, taxas de plataforma, taxas do prestador, custos de terceiros e moeda aplicavel devem ser exibidos antes da confirmacao quando operacionalmente disponiveis.',
                      'Pagamentos podem ser processados por provedores como Stripe, PIX, cartao, boleto, carteira digital ou outro meio aprovado. A plataforma nao deve armazenar numero completo de cartao.',
                      'Assinaturas renovam conforme o plano aceito. Cancelamento interrompe cobrancas futuras, mas nao gera reembolso proporcional salvo quando exigido por lei ou pela politica especifica do plano.',
                      'Reembolsos de servicos dependem do status do trabalho, politica do prestador, custos ja incorridos, regras de marketplace e direitos obrigatorios do consumidor no Brasil.',
                      'Quando o direito de arrependimento de 7 dias for aplicavel a compra remota, ele sera respeitado conforme a lei brasileira, observadas excecoes legais, execucao ja iniciada, produtos digitais acessados e custos de terceiros.',
                      'Chargebacks, fraude de pagamento, abuso de cupom ou tentativa de burlar a taxa da plataforma podem resultar em suspensao e cobranca de valores devidos.',
                    ]
                  : [
                      'Prices, taxes, platform fees, provider fees, third-party costs, and applicable currency should be shown before confirmation where operationally available.',
                      'Payments may be processed by providers such as Stripe, PIX, card, boleto, digital wallet, or another approved method. The platform must not store full card numbers.',
                      'Subscriptions renew according to the accepted plan. Cancellation stops future charges but does not create a prorated refund unless required by law or the specific plan policy.',
                      'Service refunds depend on work status, provider policy, incurred costs, marketplace rules, and mandatory Brazilian consumer rights.',
                      'Where the 7-day right of withdrawal applies to a remote purchase, it will be honored under Brazilian law, subject to legal exceptions, work already started, digital products already accessed, and third-party costs.',
                      'Chargebacks, payment fraud, coupon abuse, or attempts to bypass platform fees may result in suspension and collection of amounts due.',
                    ]
              }
            />
          </Section>

          <Section title={isPt ? '5. Dados, privacidade e controles tecnicos' : '5. Data, Privacy, and Technical Controls'}>
            <p>
              {isPt
                ? `O tratamento de dados e descrito na Politica de Privacidade da ${profile.brandName}. Os dados sensiveis para esta marca incluem ${profile.sensitiveDataPt}.`
                : `${profile.brandName}'s processing of data is described in the Privacy Policy. Sensitive data for this brand includes ${profile.sensitiveDataEn}.`}
            </p>
            <BulletList
              items={
                isPt
                  ? [
                      'Dados privados devem usar RLS ou controle equivalente por linha, papel, dono, equipe, relacionamento e finalidade.',
                      'Arquivos privados devem usar buckets/pastas com politicas de armazenamento, URLs assinadas, expiracao e verificacao de autorizacao antes de cada acesso.',
                      'Paginas privadas, respostas autenticadas e dados de usuario devem usar no-store ou cache segmentado por usuario, sem vazamento entre contas.',
                      'Logs, analytics, traces de IA, screenshots, exportacoes e suporte devem remover ou mascarar senhas, tokens, chaves, documentos, dados financeiros e dados sensiveis.',
                      'Incidentes de seguranca devem ser triados, contidos, documentados e comunicados conforme LGPD, ANPD e regras aplicaveis.',
                    ]
                  : [
                      'Private data must use RLS or equivalent controls by row, role, owner, team, relationship, and purpose.',
                      'Private files must use storage bucket/folder policies, signed URLs, expiration, and authorization checks before each access.',
                      'Private pages, authenticated responses, and user data must use no-store or user-segmented caching, with no leakage across accounts.',
                      'Logs, analytics, AI traces, screenshots, exports, and support workflows must remove or mask passwords, tokens, keys, documents, financial data, and sensitive data.',
                      'Security incidents must be triaged, contained, documented, and communicated under LGPD, ANPD, and applicable rules.',
                    ]
              }
            />
          </Section>

          <Section title={isPt ? '6. Uso aceitavel, conteudo e avaliacoes' : '6. Acceptable Use, Content, and Reviews'}>
            <BulletList
              items={
                isPt
                  ? [
                      'Avaliacoes devem ser autenticas, baseadas em experiencia real e nao podem ser compradas, coagidas, falsas ou manipuladas.',
                      'Voce nao pode publicar conteudo ilegal, enganoso, discriminatorio, difamatorio, abusivo, invasivo de privacidade, com malware ou que viole direitos de terceiros.',
                      'Voce concede a plataforma uma licenca limitada para hospedar, exibir e operar o conteudo que voce envia, somente para fornecer, proteger e melhorar o servico.',
                      'A plataforma pode moderar, remover, limitar, preservar para auditoria ou denunciar conteudo quando necessario para seguranca, conformidade, disputa, fraude ou obrigacao legal.',
                    ]
                  : [
                      'Reviews must be authentic, based on real experience, and must not be bought, coerced, false, or manipulated.',
                      'You may not post illegal, misleading, discriminatory, defamatory, abusive, privacy-invasive, malware-bearing, or rights-violating content.',
                      'You grant the platform a limited license to host, display, and operate content you submit, only to provide, protect, and improve the service.',
                      'The platform may moderate, remove, limit, preserve for audit, or report content where needed for safety, compliance, dispute, fraud, or legal obligation.',
                    ]
              }
            />
          </Section>

          <Section title={isPt ? '7. IA, automacao e decisoes humanas' : '7. AI, Automation, and Human Decisions'}>
            <p>
              {isPt
                ? 'Recursos de IA podem ajudar com triagem, busca, resumo, suporte, qualidade, risco, seguranca, classificacao, traducao e produtividade. A IA nao substitui julgamento profissional, revisao humana, obrigacoes legais ou decisoes de seguranca.'
                : 'AI features may assist with triage, search, summaries, support, quality, risk, security, classification, translation, and productivity. AI does not replace professional judgment, human review, legal obligations, or security decisions.'}
            </p>
            <p>
              {isPt
                ? 'Saidas de IA que afetem direitos, pagamentos, suspensoes, elegibilidade, atendimento sensivel ou comunicacoes profissionais devem ter revisao humana quando exigido por lei, risco ou politica interna.'
                : 'AI outputs affecting rights, payments, suspensions, eligibility, sensitive service delivery, or professional communications must receive human review where required by law, risk, or internal policy.'}
            </p>
          </Section>

          <Section title={isPt ? '8. Apps Apple, Google Play e exclusao de conta' : '8. Apple Apps, Google Play, and Account Deletion'}>
            <BulletList
              items={
                isPt
                  ? [
                      'Permissoes de app, como camera, microfone, localizacao, notificacoes, fotos, arquivos, contatos ou biometria, devem ser solicitadas apenas quando necessarias e explicadas no contexto.',
                      'Usuarios devem ter caminho para solicitar exclusao de conta e dados, sujeito a retencoes legais, fiscais, antifraude, seguranca, disputa, chargeback e registros profissionais.',
                      'Declaracoes de privacidade da Apple App Store e Google Play Data Safety devem refletir dados coletados, compartilhados, finalidade, seguranca, exclusao e retencao.',
                    ]
                  : [
                      'App permissions, such as camera, microphone, location, notifications, photos, files, contacts, or biometrics, must be requested only when needed and explained in context.',
                      'Users must have a path to request account and data deletion, subject to legal, tax, anti-fraud, security, dispute, chargeback, and professional-record retention.',
                      'Apple App Store privacy disclosures and Google Play Data Safety disclosures must reflect collected data, sharing, purpose, security, deletion, and retention.',
                    ]
              }
            />
          </Section>

          <Section title={isPt ? '9. Lei aplicavel, disputas e contato' : '9. Governing Law, Disputes, and Contact'}>
            <p>
              {isPt
                ? 'Estes Termos sao regidos pelas leis da Republica Federativa do Brasil, sem prejuizo de direitos obrigatorios do consumidor e regras profissionais aplicaveis. Disputas devem ser tentadas primeiro por suporte, mediacao operacional e resolucao de boa-fe.'
                : 'These Terms are governed by the laws of the Federative Republic of Brazil, without limiting mandatory consumer rights and applicable professional rules. Disputes should first be attempted through support, operational mediation, and good-faith resolution.'}
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
