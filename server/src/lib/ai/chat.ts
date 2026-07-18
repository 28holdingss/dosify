type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type ChatCompletionOptions = {
  messages: ChatMessage[];
  temperature?: number;
  jsonMode?: boolean;
};

type AiProvider = {
  name: 'groq' | 'openai';
  baseUrl: string;
  apiKey: string;
  model: string;
};

function getProviders(): AiProvider[] {
  const providers: AiProvider[] = [];

  if (process.env.GROQ_API_KEY) {
    providers.push({
      name: 'groq',
      baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
    });
  }

  if (process.env.OPENAI_API_KEY) {
    providers.push({
      name: 'openai',
      baseUrl: 'https://api.openai.com/v1/chat/completions',
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    });
  }

  return providers;
}

export async function chatCompletion(
  options: ChatCompletionOptions,
): Promise<{ content: string; provider: AiProvider['name'] } | null> {
  const providers = getProviders();
  if (providers.length === 0) return null;

  for (const provider of providers) {
    try {
      const body: Record<string, unknown> = {
        model: provider.model,
        temperature: options.temperature ?? 0.3,
        messages: options.messages,
      };

      if (options.jsonMode) {
        body.response_format = { type: 'json_object' };
      }

      const res = await fetch(provider.baseUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) continue;

      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = data.choices?.[0]?.message?.content;
      if (!content) continue;

      return { content, provider: provider.name };
    } catch {
      continue;
    }
  }

  return null;
}

export function hasAiProvider(): boolean {
  return getProviders().length > 0;
}
