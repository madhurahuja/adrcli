import type { LLMProvider } from './base.js'
import { ClaudeProvider } from './claude.js'
import { OpenAIProvider } from './openai.js'
import { OllamaProvider } from './ollama.js'
import { loadConfig, getApiKey } from '../config/store.js'
import { ensureOllama } from '../cli/ollama-setup.js'

export async function createProvider(): Promise<LLMProvider> {
  const config = loadConfig()
  const { provider, model, ollamaUrl } = config
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
    default:
      throw new Error(
        `Unknown provider: "${config.provider}". Run: adrcli config set provider <claude|openai|ollama>`
      )
  }
}
