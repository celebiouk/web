// Tiered AI client for CeleStudio.
//
// "standard" tier  → GPT-4.1-mini    (cheap, fast, used for normal generation)
// "premium" tier   → GPT-4.1 (full)  (reserved for polish + advanced operations)
//
// Phase 1 only uses "standard". Phase 2 will surface a "Polish with premium AI"
// button on the editor that calls this with tier="premium".

import OpenAI from 'openai';

export type AITier = 'standard' | 'premium';

const MODEL_BY_TIER: Record<AITier, string> = {
  standard: 'gpt-4.1-mini',
  premium: 'gpt-4.1',
};

let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (_client) return _client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');
  _client = new OpenAI({ apiKey });
  return _client;
}

export interface GenerateJsonOptions {
  systemPrompt: string;
  userMessage: string;
  tier?: AITier;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Generate JSON output from the chosen tier model.
 * Forces JSON object response format for reliability.
 * Returns the raw JSON string (caller is responsible for JSON.parse).
 */
export async function generateJson({
  systemPrompt,
  userMessage,
  tier = 'standard',
  maxTokens = 8000,
  temperature = 0.7,
}: GenerateJsonOptions): Promise<string> {
  const model = MODEL_BY_TIER[tier];
  const client = getClient();

  const response = await client.chat.completions.create({
    model,
    max_tokens: maxTokens,
    temperature,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('AI returned empty response');
  }
  return content;
}

/**
 * Surface for callers that want to know what model actually ran (for logs/billing).
 */
export function modelForTier(tier: AITier): string {
  return MODEL_BY_TIER[tier];
}
