import { AIProvider } from "../types";

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-5";

export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async complete({ system, prompt, maxTokens = 400 }: { system: string; prompt: string; maxTokens?: number }): Promise<string> {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    const blocks: { type: string; text?: string }[] = data?.content ?? [];
    const text = blocks.find((b) => b.type === "text")?.text;
    if (!text) throw new Error(`Tomt svar från Anthropic API: ${JSON.stringify(data)}`);
    return text as string;
  }
}
