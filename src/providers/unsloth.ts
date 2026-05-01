import type { LLMProvider } from './base.js'
import type { LLMOptions } from '../types.js'

interface ChatMessage {
  role: 'system' | 'user'
  content: string
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

export class UnslothProvider implements LLMProvider {
  readonly id = 'unsloth'
  private baseUrl: string
  private model: string

  constructor(baseUrl = 'http://localhost:2242', model = 'unsloth/Llama-3.2-3B-Instruct') {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.model = model
  }

  async call(prompt: string, opts: LLMOptions = {}): Promise<string> {
    const messages: ChatMessage[] = []
    if (opts.system) {
      messages.push({ role: 'system', content: opts.system })
    }
    messages.push({ role: 'user', content: prompt })

    const res = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: opts.maxTokens ?? 4096,
        temperature: opts.temperature ?? 0.7,
      }),
    })

    if (!res.ok) throw new Error(`Unsloth error: ${res.status} ${res.statusText}`)
    const data = (await res.json()) as ChatCompletionResponse
    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error('Unsloth returned an empty response')
    return content
  }
}
