export type AiChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export class AiProviderConfigurationError extends Error {
  constructor() {
    super('AI provider is not configured');
    this.name = 'AiProviderConfigurationError';
  }
}

type AiCompletionRequest = {
  messages: AiChatMessage[];
  stream?: boolean;
};

function getProviderConfig() {
  const endpoint = Deno.env.get('BAISE_AI_CHAT_COMPLETIONS_URL')?.trim();
  const apiKey = Deno.env.get('BAISE_AI_API_KEY')?.trim();
  const model = Deno.env.get('BAISE_AI_MODEL')?.trim();

  if (!endpoint || !apiKey || !model) {
    throw new AiProviderConfigurationError();
  }

  let parsedEndpoint: URL;
  try {
    parsedEndpoint = new URL(endpoint);
  } catch {
    throw new AiProviderConfigurationError();
  }

  if (
    parsedEndpoint.protocol !== 'https:' ||
    parsedEndpoint.username ||
    parsedEndpoint.password
  ) {
    throw new AiProviderConfigurationError();
  }

  return { endpoint: parsedEndpoint.toString(), apiKey, model };
}

/**
 * Calls a configured OpenAI-compatible chat-completions endpoint.
 * There is no embedded provider fallback: missing or invalid configuration fails closed.
 */
export async function requestAiChatCompletion({
  messages,
  stream = false,
}: AiCompletionRequest): Promise<Response> {
  const { endpoint, apiKey, model } = getProviderConfig();

  return fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages, stream }),
  });
}
