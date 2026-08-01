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
  const isEs = (i18n.language || '').startsWith('es');

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
            {isPt ? 'Privacidade LGPD - Brasil primeiro' : isEs ? 'Privacidad LGPD, Brasil primero' : 'LGPD Privacy - Brazil first'}
          </p>
          <h1 className="mt-2 text-3xl font-bold">
            {isPt ? 'Política de Privacidade e Proteção de Dados' : isEs ? 'Política de Privacidad y Declaración de Protección de Datos' : 'Privacy Policy and Data Protection Statement'}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {isPt ? 'Última atualização: 7 de julho de 2026. Versão 2026.07.' : isEs ? 'Última actualización: 7 de julio de 2026. Versión 2026.07.' : 'Last updated: July 7, 2026. Version 2026.07.'}
          </p>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-5">
          <Section title={isPt ? '1. Quem somos e como esta política se aplica' : isEs ? '1. Quiénes somos y cómo se aplica esta política' : '1. Who We Are and How This Policy Applies'}>
            <p>
              {isPt
                ? `${profile.brandName} e ${profile.marketplacePt}. Está política se aplica ao site, portal, web app, app iOS/Apple, app Android/Google Play, suporte, mensagens, pagamentos, assinaturas, arquivos, recursos de IA e qualquer area autenticada da plataforma.` : isEs ? `${profile.brandName} es ${profile.marketplaceEs}. Esta política se aplica al sitio web, el portal, la aplicación web, la app de iOS/Apple, la app de Android/Google Play, el soporte, la mensajería, los pagos, las suscripciones, los archivos, las funciones de IA y cualquier área autenticada de la plataforma.` : `${profile.brandName} is ${profile.marketplaceEn}. This policy applies to the website, portal, web app, iOS/Apple app, Android/Google Play app, support, messaging, payments, subscriptions, files, AI features, and any authenticated platform area.`}
            </p>
            <p>
              {isPt
                ? 'Tratamos a LGPD como padrão base. Onde a plataforma for lancada fora do Brasil, aplicaremos camadas adicionais como GDPR/UK GDPR, CCPA/CPRA, regras de lojas de apps e exigências locais.' : isEs ? 'Tomamos la LGPD como estándar base. Cuando la plataforma opera fuera de Brasil, aplicamos capas adicionales como el RGPD y el RGPD del Reino Unido, la CCPA/CPRA, las reglas de las tiendas de aplicaciones y los requisitos locales.' : 'We treat LGPD as the baseline standard. Where the platform launches outside Brazil, we apply additional layers such as GDPR/UK GDPR, CCPA/CPRA, app store rules, and local requirements.'}
            </p>
          </Section>

          <Section title={isPt ? '2. Dados que coletamos' : isEs ? '2. Datos que recopilamos' : '2. Data We Collect'}>
            <BulletList
              items={
                isPt
                  ? [
                      'Identidade e contato: nome, e-mail, telefone, CPF/CNPJ quando aplicável, endereço, foto, idioma, cidade, estado e pais.',
                      `Dados especificos da marca: ${profile.sensitiveDataPt}.`,
                      'Conta e segurança: login, convites, redefinições de senha, MFA, sessões, dispositivos, eventos de autenticação, tentativas falhas, bloqueios, papeis e permissões.',
                      'Pagamentos e assinaturas: histórico de compras, status de pagamento, reembolsos, chargebacks, recibos, tokens de processadores e referências de transação. Não armazenamos número completo de cartao.',
                      'Comunicações: mensagens no app, e-mails, SMS, WhatsApp, chamadas, suporte, anexos, consentimentos e preferências.',
                      'Uso técnico: IP, navegador, sistema operacional, identificadores, cookies, analytics, logs, erros, performance, cache, auditoria e eventos antifraude.',
                      'Dados de terceiros: provedores de pagamento, provedores de identidade, profissionais, parceiros, fontes publicas, registros profissionais e autoridades quando necessario.',
                    ]
              : isEs ? ['Identidad y contacto: nombre, correo, teléfono, CPF/CNPJ cuando corresponda, dirección, foto, idioma, ciudad, estado y país.', 'Cuenta y seguridad: inicio de sesión, invitaciones, restablecimientos de contraseña, MFA, sesiones, dispositivos, eventos de autenticación, intentos fallidos, bloqueos, roles y permisos.', 'Pagos y suscripciones: historial de compras, estado de pago, reembolsos, contracargos, recibos, tokens del procesador y referências de transacción. No almacenamos números de tarjeta completos.', 'Comunicaciones: mensajes en la app, correo, SMS, WhatsApp, llamadas, soporte, adjuntos, consentimientos y preferências.', 'Uso técnico: IP, navegador, sistema operativo, identificadores, cookies, analítica, registros, errores, rendimiento, caché, auditoría y eventos antifraude.', 'Datos de terceros: proveedores de pago, proveedores de identidad, profesionales, socios, fuentes públicas, registros profesionales y autoridades cuando sea necesario.']
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

          <Section title={isPt ? '3. Como usamos dados' : isEs ? '3. Cómo usamos los datos' : '3. How We Use Data'}>
            <BulletList
              items={
                isPt
                  ? [
                      'Operar a plataforma, contas, perfis, busca, agendamento, mensagens, pagamentos, avaliações, suporte e recursos do portal.',
                      'Verificar identidade, elegibilidade, credenciais profissionais, permissao de acesso, relacionamento entre usuários e prevencao de fraude.',
                      'Processar pagamentos, assinaturas, reembolsos, disputas, chargebacks, recibos e obrigações fiscais.',
                      'Aplicar segurança: RLS, politicas de armazenamento, controles por papel, segregação por usuário, verificação de sessão, cache seguro, auditoria e resposta a incidentes.',
                      'Melhorar qualidade, acessibilidade, localização, traduções, desempenho, confiabilidade, analytics e experiência do usuário.',
                      'Cumprir leis, ordens, regulamentos profissionais, direitos do consumidor, LGPD, regras das lojas de apps e solicitações validas de autoridades.',
                    ]
              : isEs ? ['Operar la plataforma, las cuentas, los perfiles, la búsqueda, la agenda, la mensajería, los pagos, las reseñas, el soporte y las funciones del portal.', 'Verificar identidad, elegibilidad, credenciales profesionales, permisos de acceso, relaciones entre usuários y prevención de fraude.', 'Procesar pagos, suscripciones, reembolsos, disputas, contracargos, recibos y obligaciones fiscales.', 'Aplicar seguridad: RLS, políticas de almacenamiento, control por roles, segregación de usuários, verificación de sesiones, caché segura, auditoría y respuesta a incidentes.', 'Mejorar la calidad, la accesibilidad, la localización, las traducciones, el rendimiento, la fiabilidad, la analítica y la experiência de usuário.', 'Cumplir leyes, órdenes, normas profesionales, derechos del consumidor, la LGPD, las reglas de las tiendas de aplicaciones y las solicitudes válidas de autoridades.']
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

          <Section title={isPt ? '4. Bases legais LGPD' : isEs ? '4. Bases legales de la LGPD' : '4. LGPD Legal Bases'}>
            <BulletList
              items={
                isPt
                  ? [
                      'Execucao de contrato ou procedimentos preliminares solicitados por você.',
                      'Cumprimento de obrigação legal ou regulatoria.',
                      'Consentimento, inclusive para marketing, cookies opcionais, permissões de app e dados sensíveis quando exigido.',
                      'Legitimo interesse para segurança, prevencao de fraude, melhoria, suporte, auditoria e operação, sempre balanceado com seus direitos.',
                      'Exercicio regular de direitos em processos judiciais, administrativos ou arbitrais.',
                      'Proteção da vida, tutela da saúde ou proteção do crédito quando aplicável ao contexto.',
                    ]
              : isEs ? ['Ejecución de un contrato o de trámites precontractuales solicitados por ti.', 'Cumplimiento de una obligación legal o regulatoria.', 'Consentimiento, incluido el de marketing, cookies opcionales, permisos de la aplicación y datos sensibles cuando se exija.', 'Intereses legítimos en seguridad, prevención de fraude, mejora, soporte, auditoría y operaciones, ponderados frente a tus derechos.', 'Ejercicio regular de derechos en procesos judiciales, administrativos o arbitrales.', 'Protección de la vida, protección de la salud o protección del crédito cuando corresponda al contexto.']
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

          <Section title={isPt ? '5. Compartilhamento' : isEs ? '5. Compartición' : '5. Sharing'}>
            <p>
              {isPt
                ? 'Não vendemos dados pessoais. Compartilhamos somente quando necessario para operar, proteger, cumprir a lei ou entregar o serviço solicitado.' : isEs ? 'No vendemos datos personales. Solo los compartimos cuando es necesario para operar, proteger, cumplir la ley o prestar el servicio solicitado.' : 'We do not sell personal data. We share only where needed to operate, protect, comply with law, or deliver the requested service.'}
            </p>
            <BulletList
              items={
                isPt
                  ? [
                      'Com usuários e profissionais envolvidos na transação, somente conforme permissao, papel, finalidade e visibilidade da plataforma.',
                      'Com provedores de pagamento, hospedagem, banco de dados, e-mail, SMS, WhatsApp, analytics, mapas, suporte, segurança, armazenamento e automação.',
                      'Com consultores, auditores, advogados, contadores, seguradoras, parceiros e autoridades quando necessario e permitido.',
                      'Com lojas de apps, provedores de identidade e sistemas operacionais para segurança, login, notificações, compras ou permissao de dispositivo.',
                      'Em transferência societaria, fusao, aquisicao ou reorganização, sob proteções equivalentes.',
                    ]
              : isEs ? ['Con los usuários y profesionales involucrados en la transacción, solo según el permiso, el rol, la finalidad y la visibilidad de la plataforma.', 'Con proveedores de pago, alojamiento, base de datos, correo, SMS, WhatsApp, analítica, mapas, soporte, seguridad, almacenamiento y automatización.', 'Con asesores, auditores, abogados, contadores, aseguradoras, socios y autoridades cuando sea necesario y esté permitido.', 'Con tiendas de aplicaciones, proveedores de identidad y sistemas operativos para seguridad, inicio de sesión, notificaciones, compras o permisos del dispositivo.', 'En una transferência societaria, fusión, adquisición o reorganización, bajo protecciones equivalentes.']
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

          <Section title={isPt ? '6. Segurança, RLS, limites de taxa, cache e limpeza de dados' : isEs ? '6. Seguridad, RLS, límites de tasa, caché y depuración de datos' : '6. Security, RLS, Rate Limits, Caching, and Scrubbing'}>
            <BulletList
              items={
                isPt
                  ? [
                      'Supabase e bancos similares devem manter RLS habilitado em tabelas privadas, com politicas por usuário, papel, equipe, dono, relacionamento e finalidade.',
                      'Service-role keys, secrets, tokens e variaveis sensíveis nunca devem ser expostos ao navegador, app cliente, logs ou screenshots.',
                      'Dados privados em portal, API ou app devem usar Cache-Control: no-store ou cache segmentado por usuário e inválido em logout, troca de papel, atualização sensivel ou revogação.',
                      'Login, cadastro, redefinicao de senha, convite, MFA, upload, exportação, pagamento, webhook, mensagens, IA, e-mail, SMS, API e outras rotas caras ou sujeitas a abuso devem ter limites de taxa, quotas, filas, desafios, bloqueios temporarios ou suspensao conforme o risco.',
                      'Logs, traces de IA, analytics, ferramentas de suporte, dumps, relatórios e screenshots devem ser scrubbed ou mascarados antes de armazenamento, revisao ou compartilhamento.',
                      'Mensagens de erro de login devem ser genericas e não revelar qual credencial falhou nem se uma conta existe.',
                      'Testes de segurança, revisoes de RLS, verificação de buckets, checagem de cache, varredura de segredos e validação de permissao devem ocorrer antes de lancamentos e em ciclos recorrentes.',
                    ]
              : isEs ? ['Supabase y bases de datos similares deben mantener RLS activo en las tablas privadas, con políticas por usuário, rol, equipo, propietario, relación y finalidad.', 'Las claves de rol de servicio, los secretos, los tokens y las variables sensibles nunca deben exponerse al navegador, la aplicación cliente, los registros ni las capturas de pantalla.', 'Los datos privados del portal, la API o la aplicación deben usar Cache-Control: no-store o caché segmentada por usuário, e invalidarse al cerrar sesión, cambiar de rol, actualizar datos sensibles o revocar accesos.', 'El inicio de sesión, el registro, el restablecimiento de contraseña, las invitaciones, la MFA, las subidas, las exportaciones, los pagos, los webhooks, la mensajería, la IA, el correo, los SMS, la API y otras rutas costosas o propensas a abuso deben tener límites de tasa, cuotas, colas, desafíos, bloqueos temporales o suspensión según el riesgo.', 'Los registros, las trazas de IA, la analítica, las herramientas de soporte, los volcados, los informes y las capturas de pantalla deben depurarse o enmascararse antes de almacenarse, revisarse o compartirse.', 'Los mensajes de error de inicio de sesión deben ser genéricos y no deben revelar qué credencial falló ni si existe una cuenta.', 'Las pruebas de seguridad, la revisión de RLS, la verificación de buckets, los controles de caché, el escaneo de secretos y la validación de permisos deben realizarse antes de cada lanzamiento y de forma periódica.']
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

          <Section title={isPt ? '7. Retenção, exclusão e direitos LGPD' : isEs ? '7. Conservación, eliminación y derechos LGPD' : '7. Retention, Deletion, and LGPD Rights'}>
            <p>
              {isPt
                ? 'Retemos dados pelo tempo necessario para fornecer o serviço, cumprir leis, resolver disputas, prevenir fraude, manter registros fiscais, preservar segurança e respeitar obrigações profissionais. Depois, dados devem ser excluidos, anonimizados ou arquivados com acesso restrito.' : isEs ? 'Conservamos los datos mientras sean necesarios para prestar el servicio, cumplir la ley, resolver controversias, prevenir fraude, mantener registros fiscales, preservar la seguridad y respetar obligaciones profesionales. Después, los datos deben eliminarse, anonimizarse o archivarse con acceso restringido.' : 'We retain data as long as needed to provide the service, comply with law, resolve disputes, prevent fraud, maintain tax records, preserve security, and respect professional obligations. After that, data should be deleted, anonymized, or archived with restricted access.'}
            </p>
            <BulletList
              items={
                isPt
                  ? [
                      'Você pode solicitar confirmação de tratamento, acesso, correção, anonimização, bloqueio, exclusão, portabilidade, informação sobre compartilhamento, revisao de decisoes automatizadas e revogação de consentimento.',
                      'Exclusão de conta e dados pode ser limitada por retenções legais, fiscais, antifraude, segurança, chargeback, disputa, auditoria e registros profissionais.',
                      `Para exercer direitos, contate ${profile.privacyEmail}. Você também pode apresentar reclamação a ANPD.`,
                    ]
              : isEs ? ['Puedes solicitar confirmación del tratamiento, acceso, corrección, anonimización, bloqueo, eliminación, portabilidad, información sobre la compartición, revisión de decisiones automatizadas y revocación del consentimiento.', 'La eliminación de la cuenta y de los datos puede estar limitada por la conservación exigida por motivos legales, fiscales, antifraude, de seguridad, de contracargos, de controversias, de auditoría y de registros profesionales.']
              : [
                      'You may request confirmation of processing, access, correction, anonymization, blocking, deletion, portability, information about sharing, review of automated decisions, and consent revocation.',
                      'Account and data deletion may be limited by legal, tax, anti-fraud, security, chargeback, dispute, audit, and professional-record retention.',
                      `To exercise rights, contact ${profile.privacyEmail}. You may also complain to the ANPD.`,
                    ]
              }
            />
          </Section>

          <Section title={isPt ? '8. Cookies, permissões de app e transferências internacionais' : isEs ? '8. Cookies, permisos de la aplicación y transferências internacionales' : '8. Cookies, App Permissions, and International Transfers'}>
            <BulletList
              items={
                isPt
                  ? [
                      'Cookies essenciais operam login, segurança, preferência e funcionalidade. Cookies opcionais de analytics, marketing ou personalização devem respeitar consentimento quando exigido.',
                      'Permissões de app como camera, microfone, fotos, arquivos, notificações, localização e biometria sao solicitadas no contexto da funcionalidade e podem ser controladas no dispositivo.',
                      'Dados podem ser processados fora do Brasil por provedores de nuvem e infraestrutura. Usamos contratos, controles de acesso e medidas técnicas para proteger transferências internacionais.',
                    ]
              : isEs ? ['Las cookies esenciales hacen funcionar el inicio de sesión, la seguridad, las preferências y la funcionalidad. Las cookies opcionales de analítica, marketing o personalización deben respetar el consentimiento cuando se exija.', 'Los permisos de la aplicación como cámara, micrófono, fotos, archivos, notificaciones, ubicación y biometría se solicitan en contexto y pueden controlarse desde el dispositivo.', 'Los datos pueden tratarse fuera de Brasil por proveedores de nube e infraestructura. Usamos contratos, controles de acceso y medidas técnicas para proteger las transferências internacionales.']
              : [
                      'Essential cookies operate login, security, preference, and functionality. Optional analytics, marketing, or personalization cookies must respect consent where required.',
                      'App permissions such as camera, microphone, photos, files, notifications, location, and biometrics are requested in context and may be controlled on the device.',
                      'Data may be processed outside Brazil by cloud and infrastructure providers. We use contracts, access controls, and technical measures to protect international transfers.',
                    ]
              }
            />
          </Section>

          <Section title={isPt ? '9. Incidentes e contato' : isEs ? '9. Incidentes y contacto' : '9. Incidents and Contact'}>
            <p>
              {isPt
                ? 'Se identificarmos incidente de segurança com risco relevante a dados pessoais, avaliaremos impacto, conteremos o evento, registraremos evidências, comunicaremos autoridades e titulares quando exigido, e ajustaremos controles para reduzir recorrência.' : isEs ? 'Si identificamos un incidente de seguridad con riesgo relevante para los datos personales, evaluamos el impacto, contenemos el evento, preservamos la evidência, notificamos a las autoridades y a los titulares cuando corresponde, y ajustamos los controles para reducir la reincidência.' : 'If we identify a security incident with relevant risk to personal data, we assess impact, contain the event, preserve evidence, notify authorities and data subjects where required, and adjust controls to reduce recurrence.'}
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
