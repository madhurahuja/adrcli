import fs from 'fs'
import os from 'os'
import path from 'path'
import type { AdrcliConfig } from '../types.js'

const CONFIG_DIR = path.join(os.homedir(), '.adrcli')
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json')

const DEFAULTS: AdrcliConfig = {
  provider: 'ollama',
  model: 'llama3',
  ollamaUrl: 'http://localhost:11434',
}

export function loadConfig(): AdrcliConfig {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8')
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveConfig(updates: Partial<AdrcliConfig>): void {
  const existing = loadConfig()
  const merged = { ...existing, ...updates }
  fs.mkdirSync(CONFIG_DIR, { recursive: true })
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2))
}

export function getApiKey(provider: AdrcliConfig['provider']): string {
  const config = loadConfig()
  const envMap: Record<string, string | undefined> = {
    claude: process.env['ANTHROPIC_API_KEY'],
    openai: process.env['OPENAI_API_KEY'],
    ollama: 'not-required',
    unsloth: 'not-required',
  }
  const key = envMap[provider] ?? config.apiKey
  if (!key) {
    throw new Error(
      `No API key found for provider "${provider}".\n` +
        `Set env var or run: adrcli config set apiKey <key>`
    )
  }
  return key
}
