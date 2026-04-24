import type { LLMProvider } from './base.js'
import { ClaudeProvider } from './claude.js'
import { OpenAIProvider } from './openai.js'
import { OllamaProvider } from './ollama.js'
import { loadConfig, getApiKey } from '../config/store.js'

export function createProvider(): LLMProvider {
  const config = loadConfig()
  const { provider, model, ollamaUrl } = config
  switch (provider) {
    case 'claude':
      return new ClaudeProvider(getApiKey('claude'), model)
    case 'openai':
      return new OpenAIProvider(getApiKey('openai'), model)
    case 'ollama':
      return new OllamaProvider(ollamaUrl, model)
    default:
      throw new Error(
        `Unknown provider: "${config.provider}". Run: adrcli config set provider <claude|openai|ollama>`
      )
  }
}
