export const CONFIRMATION_ACTIONS = ["confirm", "decline", "reschedule"] as const;
export type ConfirmationAction = typeof CONFIRMATION_ACTIONS[number];

export type ConfirmationTokenPayload = {
  eventId: string;
  action: ConfirmationAction;
  expiresAt: number;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const toBase64Url = (bytes: Uint8Array): string => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
};

const fromBase64Url = (value: string): Uint8Array => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

const importHmacKey = (secret: string) =>
  crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );

const validatePayload = (
  candidate: unknown,
  nowSeconds: number,
): ConfirmationTokenPayload | null => {
  if (!candidate || typeof candidate !== "object") return null;
  const value = candidate as Record<string, unknown>;
  if (typeof value.eventId !== "string" || !UUID_PATTERN.test(value.eventId)) return null;
  if (
    typeof value.action !== "string" ||
    !CONFIRMATION_ACTIONS.includes(value.action as ConfirmationAction)
  ) {
    return null;
  }
  if (!Number.isInteger(value.expiresAt) || Number(value.expiresAt) < nowSeconds) return null;
  if (Number(value.expiresAt) > nowSeconds + 14 * 24 * 60 * 60) return null;
  return {
    eventId: value.eventId,
    action: value.action as ConfirmationAction,
    expiresAt: Number(value.expiresAt),
  };
};

export async function createConfirmationToken(
  payload: ConfirmationTokenPayload,
  secret: string,
): Promise<string> {
  if (secret.length < 32) throw new Error("callback signing secret is too short");
  const validated = validatePayload(payload, Math.floor(Date.now() / 1000) - 1);
  if (!validated) throw new Error("invalid confirmation token payload");

  const encodedPayload = toBase64Url(encoder.encode(JSON.stringify(validated)));
  const key = await importHmacKey(secret);
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, encoder.encode(encodedPayload)),
  );
  return `${encodedPayload}.${toBase64Url(signature)}`;
}

export async function verifyConfirmationToken(
  token: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<ConfirmationTokenPayload | null> {
  if (secret.length < 32 || token.length > 2048) return null;
  const [encodedPayload, encodedSignature, extra] = token.split(".");
  if (!encodedPayload || !encodedSignature || extra) return null;

  try {
    const key = await importHmacKey(secret);
    const signatureValid = await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(encodedSignature),
      encoder.encode(encodedPayload),
    );
    if (!signatureValid) return null;

    const decoded = decoder.decode(fromBase64Url(encodedPayload));
    return validatePayload(JSON.parse(decoded), nowSeconds);
  } catch {
    return null;
  }
}

export function normalizeReminderOffsets(
  offsets: number[],
  maxCount = 6,
): number[] {
  return Array.from(
    new Set(
      offsets
        .filter((offset) => Number.isInteger(offset))
        .filter((offset) => offset >= 15 && offset <= 10080),
    ),
  )
    .sort((left, right) => right - left)
    .slice(0, maxCount);
}

export function minimumNecessaryCopy(
  eventType: string,
  locale: "en" | "pt" | "es",
): { subject: string; body: string; isMarketing: boolean } {
  const copy = {
    en: {
      confirmation_request: ["Please confirm a MD Baise appointment", "An appointment response is requested. No medical details are included in this message."],
      reminder: ["Upcoming MD Baise appointment", "You have an upcoming appointment. Sign in to the secure portal for details or changes."],
      follow_up: ["MD Baise follow-up", "A private follow-up is available. Sign in to the secure portal to review it."],
      thank_you: ["Thank you from MD Baise", "Thank you for using MD Baise. Your private appointment record remains available in the secure portal."],
      review_request: ["Share optional feedback", "If you choose, share honest feedback. Do not include symptoms, diagnoses, treatment, insurance information, or appointment details in a public review."],
    },
    pt: {
      confirmation_request: ["Confirme uma consulta na MD Baise", "Uma resposta sobre a consulta foi solicitada. Nenhum detalhe médico está incluído nesta mensagem."],
      reminder: ["Próxima consulta na MD Baise", "Você tem uma próxima consulta. Entre no portal seguro para ver detalhes ou alterações."],
      follow_up: ["Acompanhamento da MD Baise", "Um acompanhamento privado está disponível. Entre no portal seguro para consultá-lo."],
      thank_you: ["Obrigado por usar a MD Baise", "Obrigado por usar a MD Baise. Seu registro privado continua disponível no portal seguro."],
      review_request: ["Compartilhe feedback opcional", "Se quiser, compartilhe uma avaliação honesta. Não inclua sintomas, diagnósticos, tratamentos, dados de seguro ou detalhes da consulta em uma avaliação pública."],
    },
    es: {
      confirmation_request: ["Confirma una cita en MD Baise", "Se solicitó una respuesta sobre la cita. Este mensaje no incluye detalles médicos."],
      reminder: ["Próxima cita en MD Baise", "Tienes una próxima cita. Ingresa al portal seguro para ver detalles o cambios."],
      follow_up: ["Seguimiento de MD Baise", "Hay un seguimiento privado disponible. Ingresa al portal seguro para consultarlo."],
      thank_you: ["Gracias por usar MD Baise", "Gracias por usar MD Baise. Tu registro privado sigue disponible en el portal seguro."],
      review_request: ["Comparte comentarios opcionales", "Si deseas, comparte una reseña honesta. No incluyas síntomas, diagnósticos, tratamientos, datos del seguro ni detalles de la cita en una reseña pública."],
    },
  } as const;

  const localized = copy[locale] || copy.en;
  const selected = localized[eventType as keyof typeof localized] || localized.reminder;
  return {
    subject: selected[0],
    body: selected[1],
    isMarketing: eventType === "review_request",
  };
}
