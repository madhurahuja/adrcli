import { spawn, execSync } from 'child_process'
import { confirm } from '@inquirer/prompts'
import chalk from 'chalk'
import os from 'os'

interface OllamaStatus {
  running: boolean
  models: string[]
}

async function checkOllamaServer(baseUrl: string): Promise<OllamaStatus> {
  try {
    const res = await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return { running: false, models: [] }
    const data = (await res.json()) as { models: Array<{ name: string }> }
    return { running: true, models: (data.models ?? []).map(m => m.name) }
  } catch {
    return { running: false, models: [] }
  }
}

function isOllamaInstalled(): boolean {
  try {
    execSync(os.platform() === 'win32' ? 'where ollama' : 'which ollama', {
      stdio: 'ignore',
    })
    return true
  } catch {
    return false
  }
}

async function pullModel(model: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('ollama', ['pull', model], { stdio: 'inherit' })
    child.on('exit', code =>
      code === 0 ? resolve() : reject(new Error(`ollama pull exited with code ${code}`))
    )
    child.on('error', reject)
  })
}

async function startOllamaServer(): Promise<void> {
  spawn('ollama', ['serve'], { detached: true, stdio: 'ignore' }).unref()
  await new Promise(r => setTimeout(r, 2000))
}

function modelMatches(available: string[], requested: string): boolean {
  const base = requested.split(':')[0]
  return available.some(
    m => m === requested || m.startsWith(base + ':') || m === base
  )
}

function printInstallBox(): void {
  const W = 58
  const line = (txt: string): string =>
    chalk.cyan('  \u2502') + txt.padEnd(W) + chalk.cyan('\u2502')
  console.log()
  console.log(chalk.cyan('  \u250c' + '\u2500'.repeat(W) + '\u2510'))
  console.log(line(''))
  console.log(line('  Ollama runs AI models locally \u2014 free & private.'))
  console.log(line(''))
  console.log(line('  Install options:'))
  console.log(line(chalk.dim('  macOS/Linux  ') + 'curl -fsSL https://ollama.com/install.sh | sh'))
  console.log(line(chalk.dim('  Windows      ') + 'https://ollama.com/download'))
  console.log(line(chalk.dim('  Docker       ') + 'docker run -d -p 11434:11434 ollama/ollama'))
  console.log(line(''))
  console.log(line('  After install:'))
  console.log(line(chalk.dim('    ') + 'ollama serve'))
  console.log(line(chalk.dim('    ') + 'ollama pull llama3'))
  console.log(line(''))
  console.log(chalk.cyan('  \u2514' + '\u2500'.repeat(W) + '\u2518'))
  console.log()
}

export async function ensureOllama(baseUrl: string, model: string): Promise<void> {
  let status = await checkOllamaServer(baseUrl)

  if (status.running) {
    if (modelMatches(status.models, model)) return

    console.log()
    console.log(chalk.yellow(`  \u26a0  Model "${model}" not found locally.`))
    if (status.models.length > 0) {
      console.log(chalk.dim(`  Available: ${status.models.join(', ')}`))
    }
    const pull = await confirm({
      message: `Pull "${model}" now? (may be several GB)`,
      default: true,
    })
    if (!pull) {
      throw new Error(`Model "${model}" not available. Run: ollama pull ${model}`)
    }
    console.log(chalk.cyan(`\n  Pulling ${model}...\n`))
    await pullModel(model)
    return
  }

  if (isOllamaInstalled()) {
    console.log()
    console.log(chalk.yellow('  \u26a0  Ollama is installed but not running.'))
    const doStart = await confirm({
      message: 'Start Ollama server now?',
      default: true,
    })
    if (!doStart) {
      throw new Error('Ollama not running. Start with: ollama serve')
    }
    console.log(chalk.dim('  Starting ollama serve in background...'))
    await startOllamaServer()

    status = await checkOllamaServer(baseUrl)
    if (!status.running) {
      throw new Error('Ollama failed to start. Run manually: ollama serve')
    }
    console.log(chalk.green('  \u2714  Ollama started.'))

    if (!modelMatches(status.models, model)) {
      const pull = await confirm({
        message: `Pull "${model}" now?`,
        default: true,
      })
      if (!pull) {
        throw new Error(`Model "${model}" not available. Run: ollama pull ${model}`)
      }
      console.log(chalk.cyan(`\n  Pulling ${model}...\n`))
      await pullModel(model)
    }
    return
  }

  printInstallBox()

  const openBrowser = await confirm({
    message: 'Open Ollama download page in browser?',
    default: true,
  })
  if (openBrowser) {
    const url = 'https://ollama.com/download'
    const platform = os.platform()
    try {
      execSync(
        platform === 'darwin'
          ? `open "${url}"`
          : platform === 'win32'
          ? `start "" "${url}"`
          : `xdg-open "${url}"`
      )
    } catch { /* ignore */ }
  }

  throw new Error(
    'Ollama not installed. Install from https://ollama.com then run:\n' +
    '  ollama serve && ollama pull ' + model
  )
}

export async function listOllamaModels(baseUrl: string): Promise<string[]> {
  try {
    const res = await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return []
    const data = (await res.json()) as { models: Array<{ name: string }> }
    return (data.models ?? []).map(m => m.name)
  } catch {
    return []
  }
}
