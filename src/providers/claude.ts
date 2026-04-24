import Anthropic from '@anthropic-ai/sdk'
import type { LLMProvider } from './base.js'
import type { LLMOptions } from '../types.js'

const SYSTEM_DEFAULT =
  'You are an expert AI architect and systems designer with deep knowledge of ' +
  'cloud infrastructure, ML systems, distributed systems, and enterprise software. ' +
  'Provide precise, opinionated analysis backed by engineering tradeoffs.'

export class ClaudeProvider implements LLMProvider {
  readonly id = 'claude'
  private client: Anthropic
  private model: string

  constructor(apiKey: string, model = 'claude-sonnet-4-6') {
    this.client = new Anthropic({ apiKey })
    this.model = model
  }

  async call(prompt: string, opts: LLMOptions = {}): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: opts.maxTokens ?? 4096,
      system: opts.system ?? SYSTEM_DEFAULT,
      messages: [{ role: 'user', content: prompt }],
    })

    const block = response.content[0]
    if (!block || block.type !== 'text') {
      throw new Error('Unexpected response structure from Claude API')
    }
    return block.text
  }
}
