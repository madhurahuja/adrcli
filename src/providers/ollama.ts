import type { LLMProvider } from './base.js'
import type { LLMOptions } from '../types.js'

export class OllamaProvider implements LLMProvider {
  readonly id = 'ollama'
  private baseUrl: string
  private model: string

  constructor(baseUrl = 'http://localhost:11434', model = 'llama3') {
    this.baseUrl = baseUrl
    this.model = model
  }

  async call(prompt: string, opts: LLMOptions = {}): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt: opts.system ? `${opts.system}\n\n${prompt}` : prompt,
        stream: false,
        options: { num_predict: opts.maxTokens ?? 4096, temperature: opts.temperature ?? 0.7 },
      }),
    })
    if (!res.ok) throw new Error(`Ollama error: ${res.status} ${res.statusText}`)
    const data = await res.json() as { response: string }
    return data.response
  }
}
