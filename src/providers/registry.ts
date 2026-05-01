import type { LLMProvider } from './base.js'
import { ClaudeProvider } from './claude.js'
import { OpenAIProvider } from './openai.js'
import { OllamaProvider } from './ollama.js'
import { UnslothProvider } from './unsloth.js'
import { loadConfig, getApiKey } from '../config/store.js'
import { ensureOllama } from '../cli/ollama-setup.js'

export async function createProvider(): Promise<LLMProvider> {
  const config = loadConfig()
  const { provider, model, ollamaUrl, unslothUrl } = config
  switch (provider) {
    case 'claude':
      return new ClaudeProvider(getApiKey('claude'), model)
    case 'openai':
      return new OpenAIProvider(getApiKey('openai'), model)
    case 'ollama': {
      const url = ollamaUrl ?? 'http://localhost:11434'
      const mdl = model ?? 'llama3'
      await ensureOllama(url, mdl)
      return new OllamaProvider(url, mdl)
    }
    case 'unsloth': {
      const url = unslothUrl ?? 'http://localhost:2242'
      const mdl = model ?? 'unsloth/Llama-3.2-3B-Instruct'
      return new UnslothProvider(url, mdl)
    }
    default:
      throw new Error(
        `Unknown provider: "${config.provider}". Run: adrcli config set provider <claude|openai|ollama|unsloth>`
      )
  }
}
