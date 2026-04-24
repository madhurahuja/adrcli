import type { LLMProvider } from './base.js'
import type { LLMOptions } from '../types.js'

export class OpenAIProvider implements LLMProvider {
  readonly id = 'openai'

  constructor(_apiKey: string, _model = 'gpt-4o') {
    // Phase 2: initialize openai client here
  }

  async call(_prompt: string, _opts: LLMOptions = {}): Promise<string> {
    throw new Error(
      'OpenAI provider not yet implemented. Use: adrcli config set provider claude'
    )
  }
}
