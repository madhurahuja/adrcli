import type { LLMOptions } from '../types.js'

export interface LLMProvider {
  readonly id: string
  call(prompt: string, opts?: LLMOptions): Promise<string>
}

export type ProviderFactory = (config: {
  apiKey?: string
  model?: string
  ollamaUrl?: string
}) => LLMProvider
