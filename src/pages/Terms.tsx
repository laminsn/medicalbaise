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
  const isEs = (i18n.language || '').startsWith('es');
  const provider = isPt ? profile.providerPt : isEs ? profile.providerEs : profile.providerEn;

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
            {isPt ? 'Brasil primeiro - global em seguida' : isEs ? 'Brasil primero, el resto del mundo después' : 'Brazil first - global second'}
          </p>
          <h1 className="mt-2 text-3xl font-bold">
            {isPt ? 'Termos de Uso e Política de Serviço' : isEs ? 'Términos de Servicio y Política de Operación' : 'Terms of Service and Operating Policy'}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {isPt ? 'Última atualização: 7 de julho de 2026. Versão 2026.07.' : isEs ? 'Última actualización: 7 de julio de 2026. Versión 2026.07.' : 'Last updated: July 7, 2026. Version 2026.07.'}
          </p>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-5">
          <Section title={isPt ? '1. Escopo destes termos' : isEs ? '1. Alcance de estos términos' : '1. Scope of These Terms'}>
            <p>
              {isPt
                ? `${profile.brandName} e ${profile.marketplacePt}. Estes Termos se aplicam ao site, portal, web app, app iOS/Apple, app Android/Google Play, contas, mensagens, pagamentos, assinaturas, conteúdo, suporte, APIs e recursos de IA quando oferecidos.` : isEs ? `${profile.brandName} es ${profile.marketplaceEs}. Estos Términos se aplican al sitio web, el portal, la aplicación web, la app de iOS/Apple, la app de Android/Google Play, las cuentas, la mensajería, los pagos, las suscripciones, el contenido, el soporte, las API y las funciones de IA cuando se ofrezcan.` : `${profile.brandName} is ${profile.marketplaceEn}. These Terms apply to the website, portal, web app, iOS/Apple app, Android/Google Play app, accounts, messaging, payments, subscriptions, content, support, APIs, and AI features when offered.`}
            </p>
            <p>
              {isPt
                ? 'A experiência e estruturada para o Brasil primeiro, com LGPD, Marco Civil da Internet, Código de Defesa do Consumidor e regras profissionais brasileiras como base. Expansoes globais recebem camadas adicionais quando uma nova jurisdicao for lancada.' : isEs ? 'La experiência está estructurada primero para Brasil, tomando como base la LGPD, el Marco Civil de Internet, el Código de Defensa del Consumidor y las normas profesionales brasileñas aplicables. La expansión internacional añade capas de jurisdicción a medida que se abren nuevos mercados.' : 'The experience is structured for Brazil first, with LGPD, the Brazilian Internet Civil Framework, the Brazilian Consumer Protection Code, and applicable Brazilian professional rules as the baseline. Global expansion receives additional jurisdiction layers as new markets launch.'}
            </p>
          </Section>

          <Section title={isPt ? '2. Papel da plataforma e limites profissionais' : isEs ? '2. Papel de la plataforma y límites profesionales' : '2. Platform Role and Professional Boundaries'}>
            <p>{isPt ? profile.professionalBoundaryPt : isEs ? profile.professionalBoundaryEs : profile.professionalBoundaryEn}</p>
            {profile.emergencyEn && (
              <p className="font-semibold text-destructive">
                {isPt ? profile.emergencyPt : isEs ? profile.emergencyEs : profile.emergencyEn}
              </p>
            )}
            <BulletList
              items={
                isPt
                  ? [
                      `O ${provider} e independente e deve manter licenças, registros, seguros e autorizações exigidos.`,
                      `${profile.brandName} pode verificar credenciais, mas verificação não e garantia, endosso ou promessa de resultado.`,
                      `${profile.brandName} pode remover, suspender ou exigir revisao adicional quando houver risco, reclamação, fraude, conflito, credencial vencida ou violação destes Termos.`,
                    ]
              : isEs ? [`Cada ${provider} es independiente y debe mantener las licências, registros, seguros y autorizaciones exigidos.`, `${profile.brandName} puede verificar credenciales, pero la verificación no es una garantía, un respaldo ni una promesa de resultado.`, `${profile.brandName} puede retirar, suspender o exigir una revisión adicional cuando exista riesgo, reclamación, fraude, conflicto, credencial vencida o incumplimiento de estos Términos.`]
              : [
                      `Each ${provider} is independent and must maintain required licenses, registrations, insurance, and authorizations.`,
                      `${profile.brandName} may verify credentials, but verification is not a guarantee, endorsement, or promise of outcome.`,
                      `${profile.brandName} may remove, suspend, or require additional review where there is risk, complaint, fraud, conflict, expired credential, or violation of these Terms.`,
                    ]
              }
            />
          </Section>

          <Section title={isPt ? '3. Contas, login e segurança do usuário' : isEs ? '3. Cuentas, inicio de sesión y seguridad del usuário' : '3. Accounts, Login, and User Security'}>
            <BulletList
              items={
                isPt
                  ? [
                      'Você deve ter pelo menos 18 anos, fornecer informações verdadeiras e manter sua conta, senha, dispositivos, MFA e sessões sob controle.',
                      'Mensagens de erro de login devem ser genericas. A plataforma não deve revelar se o e-mail, telefone, usuário, senha, convite, código ou existência da conta foi o item incorreto.',
                      'Credenciais não devem ser compartilhadas. Contas de equipe devem usar usuários individuais, papeis, permissões e trilhas de auditoria.',
                      'Login, cadastro, redefinicao de senha, convite, MFA, upload, exportação, pagamento, webhook, mensagens, IA, e-mail, SMS, API e outras rotas caras ou sujeitas a abuso podem ser limitadas por taxa, bloqueadas, enfileiradas, desafiadas, suspensas ou encerradas conforme o risco.',
                    ]
              : isEs ? ['Debes tener al menos 18 años, dar información veraz y mantener bajo control tu cuenta, contraseña, dispositivos, MFA y sesiones.', 'Los mensajes de error de inicio de sesión deben ser genéricos. La plataforma no debe revelar si el dato incorrecto fue el correo, el teléfono, el usuário, la contraseña, la invitación, el código o la existência de la cuenta.', 'Las credenciales no se comparten. Las cuentas de equipo deben usar usuários individuales, roles, permisos y registros de auditoría.', 'El inicio de sesión, el registro, el restablecimiento de contraseña, las invitaciones, la MFA, las subidas, las exportaciones, los pagos, los webhooks, la mensajería, la IA, el correo, los SMS, la API y otras rutas costosas o propensas a abuso pueden ser limitadas, bloqueadas, encoladas, desafiadas, suspendidas o terminadas según el riesgo.']
              : [
                      'You must be at least 18, provide truthful information, and keep your account, password, devices, MFA, and sessions under control.',
                      'Login error messages must be generic. The platform must not reveal whether the email, phone, username, password, invite, code, or account existence was the incorrect item.',
                      'Credentials must not be shared. Team accounts must use individual users, roles, permissions, and audit trails.',
                      'Login, signup, password reset, invite, MFA, upload, export, payment, webhook, messaging, AI, email, SMS, API, and other expensive or abuse-prone routes may be rate-limited, blocked, queued, challenged, suspended, or terminated according to risk.',
                    ]
              }
            />
          </Section>

          <Section title={isPt ? '4. Pagamentos, assinaturas, cancelamentos e reembolsos' : isEs ? '4. Pagos, suscripciones, cancelaciones y reembolsos' : '4. Payments, Subscriptions, Cancellations, and Refunds'}>
            <BulletList
              items={
                isPt
                  ? [
                      'Precos, impostos, taxas de plataforma, taxas do prestador, custos de terceiros e moeda aplicável devem ser exibidos antes da confirmação quando operacionalmente disponiveis.',
                      'Pagamentos podem ser processados por provedores como Stripe, PIX, cartao, boleto, carteira digital ou outro meio aprovado. A plataforma não deve armazenar número completo de cartao.',
                      'Assinaturas renovam conforme o plano aceito. Cancelamento interrompe cobranças futuras, mas não gera reembolso proporcional salvo quando exigido por lei ou pela política especifica do plano.',
                      'Reembolsos de serviços dependem do status do trabalho, política do prestador, custos ja incorridos, regras de marketplace e direitos obrigatorios do consumidor no Brasil.',
                      'Quando o direito de arrependimento de 7 dias for aplicável a compra remota, ele será respeitado conforme a lei brasileira, observadas exceções legais, execucao ja iniciada, produtos digitais acessados e custos de terceiros.',
                      'Chargebacks, fraude de pagamento, abuso de cupom ou tentativa de burlar a taxa da plataforma podem resultar em suspensao e cobrança de valores devidos.',
                    ]
              : isEs ? ['Los precios, impuestos, comisiones de la plataforma, honorarios del profesional, costos de terceros y la moneda aplicable deben mostrarse antes de confirmar, cuando sea operativamente posible.', 'Los pagos pueden procesarse mediante proveedores como Stripe, PIX, tarjeta, boleto, billetera digital u otro método aprobado. La plataforma no debe almacenar números de tarjeta completos.', 'Las suscripciones se renuevan según el plan aceptado. La cancelación detiene los cargos futuros, pero no genera un reembolso prorrateado salvo que lo exija la ley o la política del plan.', 'Los reembolsos de servicios dependen del estado del trabajo, la política del profesional, los costos ya incurridos, las reglas del marketplace y los derechos irrenunciables del consumidor en Brasil.', 'Cuando corresponda el derecho de arrepentimiento de 7 días en una compra a distancia, se respetará conforme a la ley brasileña, con las excepciones legales, el trabajo ya iniciado, los productos digitales ya accedidos y los costos de terceros.', 'Los contracargos, el fraude en pagos, el abuso de cupones o los intentos de evadir las comisiones de la plataforma pueden derivar en suspensión y cobro de los importes adeudados.']
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

          <Section title={isPt ? '5. Dados, privacidade e controles técnicos' : isEs ? '5. Datos, privacidad y controles técnicos' : '5. Data, Privacy, and Technical Controls'}>
            <p>
              {isPt
                ? `O tratamento de dados e descrito na Política de Privacidade da ${profile.brandName}. Os dados sensíveis para esta marca incluem ${profile.sensitiveDataPt}.` : isEs ? `El tratamiento de datos de ${profile.brandName} se describe en la Política de Privacidad. Los datos sensibles de esta marca incluyen ${profile.sensitiveDataEs}.` : `${profile.brandName}'s processing of data is described in the Privacy Policy. Sensitive data for this brand includes ${profile.sensitiveDataEn}.`}
            </p>
            <BulletList
              items={
                isPt
                  ? [
                      'Dados privados devem usar RLS ou controle equivalente por linha, papel, dono, equipe, relacionamento e finalidade.',
                      'Arquivos privados devem usar buckets/pastas com politicas de armazenamento, URLs assinadas, expiração e verificação de autorização antes de cada acesso.',
                      'Paginas privadas, respostas autenticadas e dados de usuário devem usar no-store ou cache segmentado por usuário, sem vazamento entre contas.',
                      'Logs, analytics, traces de IA, screenshots, exportações e suporte devem remover ou mascarar senhas, tokens, chaves, documentos, dados financeiros e dados sensíveis.',
                      'Incidentes de segurança devem ser triados, contidos, documentados e comunicados conforme LGPD, ANPD e regras aplicaveis.',
                    ]
              : isEs ? ['Los datos privados deben usar RLS o controles equivalentes por fila, rol, propietario, equipo, relación y finalidad.', 'Los archivos privados deben usar políticas de bucket o carpeta, URLs firmadas, caducidad y verificación de autorización antes de cada acceso.', 'Las páginas privadas, las respuestas autenticadas y los datos del usuário deben usar no-store o caché segmentada por usuário, sin filtraciones entre cuentas.', 'Los registros, la analítica, las trazas de IA, las capturas de pantalla, las exportaciones y los flujos de soporte deben eliminar o enmascarar contraseñas, tokens, claves, documentos, datos financieros y datos sensibles.', 'Los incidentes de seguridad deben clasificarse, contenerse, documentarse y comunicarse conforme a la LGPD, la ANPD y las normas aplicables.']
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

          <Section title={isPt ? '6. Uso aceitavel, conteúdo e avaliações' : isEs ? '6. Uso aceptable, contenido y reseñas' : '6. Acceptable Use, Content, and Reviews'}>
            <BulletList
              items={
                isPt
                  ? [
                      'Avaliações devem ser autenticas, baseadas em experiência real e não podem ser compradas, coagidas, falsas ou manipuladas.',
                      'Você não pode publicar conteúdo ilegal, enganoso, discriminatorio, difamatorio, abusivo, invasivo de privacidade, com malware ou que viole direitos de terceiros.',
                      'Você concede a plataforma uma licença limitada para hospedar, exibir e operar o conteúdo que você envia, somente para fornecer, proteger e melhorar o serviço.',
                      'A plataforma pode moderar, remover, limitar, preservar para auditoria ou denunciar conteúdo quando necessario para segurança, conformidade, disputa, fraude ou obrigação legal.',
                    ]
              : isEs ? ['Las reseñas deben ser auténticas, basadas en una experiência real, y no pueden ser compradas, coaccionadas, falsas ni manipuladas.', 'No puedes publicar contenido ilegal, engañoso, discriminatorio, difamatorio, abusivo, invasivo de la privacidad, con malware o que vulnere derechos.', 'Concedes a la plataforma una licência limitada para alojar, mostrar y operar el contenido que envías, únicamente para prestar, proteger y mejorar el servicio.', 'La plataforma puede moderar, retirar, limitar, conservar para auditoría o reportar contenido cuando sea necesario por seguridad, cumplimiento, controversia, fraude u obligación legal.']
              : [
                      'Reviews must be authentic, based on real experience, and must not be bought, coerced, false, or manipulated.',
                      'You may not post illegal, misleading, discriminatory, defamatory, abusive, privacy-invasive, malware-bearing, or rights-violating content.',
                      'You grant the platform a limited license to host, display, and operate content you submit, only to provide, protect, and improve the service.',
                      'The platform may moderate, remove, limit, preserve for audit, or report content where needed for safety, compliance, dispute, fraud, or legal obligation.',
                    ]
              }
            />
          </Section>

            {/* Anti-harassment policy. Added 2026-08-10, approved by Lamin 2026-08-10.
                Owner-approved for production; a licensed-attorney review is still recommended
                for the BR jurisdiction (LGPD, consumer law) covering the PT/ES markets.
                The reporting route named here depends on the support@ mailboxes actually
                receiving mail -- see the commit for the open gate. */}
            <Section title={isPt ? '7. Assédio, discriminação e segurança pessoal' : isEs ? '7. Acoso, discriminación y seguridad personal' : '7. Anti-harassment, discrimination and personal safety'}>
              <BulletList
                items={
                  isPt
                    ? [
                        'Esta política se aplica a todos na plataforma — clientes, prestadores de serviço e qualquer pessoa que atue em nome deles — e vale em mensagens, avaliações, chamadas, vídeo e presencialmente em um serviço ou atendimento.',
                        'Assédio, intimidação, perseguição, investidas ou atenção sexual não desejada, ameaças e linguagem abusiva ou degradante são proibidos, independentemente de a pessoa atingida se manifestar no momento.',
                        'É proibida a discriminação por raça, cor, etnia, origem nacional, religião, sexo, identidade ou expressão de gênero, orientação sexual, idade, deficiência, gravidez, estado civil ou familiar, ou qualquer outra característica protegida pela legislação aplicável.',
                        'Qualquer uma das partes pode denunciar condutas que violem esta política pelo canal de suporte no aplicativo ou pelo endereço de contato indicado nestes termos. Não é necessário comprovar a violação para denunciar de boa-fé.',
                        'Violações confirmadas resultam em advertência, suspensão ou remoção permanente da plataforma, conforme a gravidade e o histórico. Condutas que envolvam ameaça, violência, coação sexual ou suspeita de crime resultam em remoção imediata e podem ser comunicadas às autoridades competentes.',
                        'Retaliação contra quem denuncia de boa-fé, ou contra quem participa de uma apuração, é em si uma violação desta política e recebe o mesmo tratamento.',
                        'As denúncias e os dados pessoais nelas contidos são tratados conforme nossa Política de Privacidade e a legislação de proteção de dados aplicável, e são compartilhados apenas com quem precisa deles para apurar os fatos ou cumprir obrigação legal.',
                        'Se você estiver em perigo imediato, acione primeiro os serviços de emergência locais. A plataforma não é um serviço de emergência e não pode intervir em uma situação em curso.',
                      ]
                : isEs ? [
                        'Esta política se aplica a todas las personas en la plataforma — clientes, proveedores de servicios y cualquiera que actúe en su nombre — y rige en mensajes, reseñas, llamadas, video y en persona durante un servicio o una cita.',
                        'Se prohíben el acoso, la intimidación, el hostigamiento, las insinuaciones o la atención sexual no deseada, las amenazas y el lenguaje abusivo o degradante, con independencia de que la persona afectada se manifieste en el momento.',
                        'Se prohíbe la discriminación por raza, color, etnia, origen nacional, religión, sexo, identidad o expresión de género, orientación sexual, edad, discapacidad, embarazo, estado civil o familiar, o cualquier otra característica protegida por la legislación aplicable.',
                        'Cualquiera de las partes puede denunciar conductas que infrinjan esta política mediante el canal de soporte de la aplicación o la dirección de contacto indicada en estos términos. No es necesario probar la infracción para denunciarla de buena fe.',
                        'Las infracciones confirmadas conllevan una advertencia, la suspensión o la expulsión permanente de la plataforma, según la gravedad y los antecedentes. Las conductas que impliquen amenazas, violencia, coacción sexual o un presunto delito conllevan la expulsión inmediata y pueden comunicarse a las autoridades competentes.',
                        'Las represalias contra quien denuncia de buena fe, o contra quien participa en una investigación, constituyen por sí mismas una infracción de esta política y reciben el mismo tratamiento.',
                        'Las denuncias y los datos personales que contienen se tratan conforme a nuestra Política de Privacidad y a la legislación de protección de datos aplicable, y solo se comparten con quienes los necesitan para investigar o para cumplir una obligación legal.',
                        'Si te encuentras en peligro inmediato, contacta primero con los servicios de emergencia locales. La plataforma no es un servicio de emergencia y no puede intervenir en una situación en curso.',
                      ]
                : [
                        'This policy applies to everyone on the platform — customers, service providers, and anyone acting on their behalf — and it applies in messages, reviews, calls, video, and in person at a job or appointment.',
                        'Harassment, intimidation, stalking, unwanted sexual attention or advances, threats, and abusive or degrading language are prohibited, whether or not the person targeted objects at the time.',
                        'Discrimination is prohibited on the basis of race, colour, ethnicity, national origin, religion, sex, gender identity or expression, sexual orientation, age, disability, pregnancy, marital or family status, or any other characteristic protected by applicable law.',
                        'Either party may report conduct that breaches this policy using the in-app support channel or the contact address in these terms. You do not need to prove a breach before reporting it in good faith.',
                        'Confirmed breaches result in a warning, suspension, or permanent removal from the platform, according to severity and history. Conduct involving threats, violence, sexual coercion, or a suspected crime results in immediate removal and may be reported to the competent authorities.',
                        'Retaliation against a person who reports in good faith, or who takes part in a review, is itself a breach of this policy and is treated the same way.',
                        'Reports and the personal data in them are handled under our Privacy Policy and applicable data-protection law, and are shared only with those who need them to investigate or to meet a legal obligation.',
                        'If you are in immediate danger, contact your local emergency services first. The platform is not an emergency service and cannot intervene in a situation as it happens.',
                      ]
                }
              />
            </Section>

          <Section title={isPt ? '8. IA, automação e decisoes humanas' : isEs ? '8. IA, automatización y decisiones humanas' : '8. AI, Automation, and Human Decisions'}>
            <p>
              {isPt
                ? 'Recursos de IA podem ajudar com triagem, busca, resumo, suporte, qualidade, risco, segurança, classificação, traducao e produtividade. A IA não substitui julgamento profissional, revisao humana, obrigações legais ou decisoes de segurança.' : isEs ? 'Las funciones de IA pueden apoyar la clasificación, la búsqueda, los resúmenes, el soporte, la calidad, el riesgo, la seguridad, la traducción y la productividad. La IA no sustituye el criterio profesional, la revisión humana, las obligaciones legales ni las decisiones de seguridad.' : 'AI features may assist with triage, search, summaries, support, quality, risk, security, classification, translation, and productivity. AI does not replace professional judgment, human review, legal obligations, or security decisions.'}
            </p>
            <p>
              {isPt
                ? 'Saidas de IA que afetem direitos, pagamentos, suspensoes, elegibilidade, atendimento sensivel ou comunicações profissionais devem ter revisao humana quando exigido por lei, risco ou política interna.' : isEs ? 'Los resultados de IA que afecten derechos, pagos, suspensiones, elegibilidad, prestación de servicios sensibles o comunicaciones profesionales deben pasar por revisión humana cuando lo exija la ley, el riesgo o la política interna.' : 'AI outputs affecting rights, payments, suspensions, eligibility, sensitive service delivery, or professional communications must receive human review where required by law, risk, or internal policy.'}
            </p>
          </Section>

          <Section title={isPt ? '9. Apps Apple, Google Play e exclusão de conta' : isEs ? '9. Aplicaciones de Apple, Google Play y eliminación de cuenta' : '9. Apple Apps, Google Play, and Account Deletion'}>
            <BulletList
              items={
                isPt
                  ? [
                      'Permissões de app, como camera, microfone, localização, notificações, fotos, arquivos, contatos ou biometria, devem ser solicitadas apenas quando necessarias e explicadas no contexto.',
                      'Usuários devem ter caminho para solicitar exclusão de conta e dados, sujeito a retenções legais, fiscais, antifraude, segurança, disputa, chargeback e registros profissionais.',
                      'Declarações de privacidade da Apple App Store e Google Play Data Safety devem refletir dados coletados, compartilhados, finalidade, segurança, exclusão e retenção.',
                    ]
              : isEs ? ['Los permisos de la aplicación, como cámara, micrófono, ubicación, notificaciones, fotos, archivos, contactos o biometría, deben solicitarse solo cuando sean necesarios y explicarse en contexto.', 'Los usuários deben poder solicitar la eliminación de su cuenta y sus datos, sujeto a la conservación exigida por motivos legales, fiscales, antifraude, de seguridad, de controversias, de contracargos y de registros profesionales.', 'Las declaraciones de privacidad de la App Store de Apple y de Seguridad de los Datos de Google Play deben reflejar los datos recopilados, la compartición, la finalidad, la seguridad, la eliminación y la conservación.']
              : [
                      'App permissions, such as camera, microphone, location, notifications, photos, files, contacts, or biometrics, must be requested only when needed and explained in context.',
                      'Users must have a path to request account and data deletion, subject to legal, tax, anti-fraud, security, dispute, chargeback, and professional-record retention.',
                      'Apple App Store privacy disclosures and Google Play Data Safety disclosures must reflect collected data, sharing, purpose, security, deletion, and retention.',
                    ]
              }
            />
          </Section>

          <Section title={isPt ? '10. Lei aplicável, disputas e contato' : isEs ? '10. Ley aplicable, controversias y contacto' : '10. Governing Law, Disputes, and Contact'}>
            <p>
              {isPt
                ? 'Estes Termos sao regidos pelas leis da Republica Federativa do Brasil, sem prejuizo de direitos obrigatorios do consumidor e regras profissionais aplicaveis. Disputas devem ser tentadas primeiro por suporte, mediação operacional e resolucao de boa-fe.' : isEs ? 'Estos Términos se rigen por las leyes de la República Federativa de Brasil, sin limitar los derechos irrenunciables del consumidor ni las normas profesionales aplicables. Las controversias deben intentarse primero por soporte, mediación operativa y resolución de buena fe.' : 'These Terms are governed by the laws of the Federative Republic of Brazil, without limiting mandatory consumer rights and applicable professional rules. Disputes should first be attempted through support, operational mediation, and good-faith resolution.'}
            </p>
            <BulletList
              items={
                isPt
                  ? [
                      `Suporte: ${profile.supportEmail}`,
                      `Privacidade/LGPD: ${profile.privacyEmail}`,
                      `Site: ${profile.website}`,
                    ]
              : isEs ? [`Soporte: ${profile.supportEmail}`, `Privacidad/LGPD: ${profile.privacyEmail}`, `Sitio web: ${profile.website}`]
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
