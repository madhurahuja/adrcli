import { Command } from 'commander'
import chalk from 'chalk'
import { saveConfig, loadConfig } from '../config/store.js'
import type { AdrcliConfig } from '../types.js'

const VALID_KEYS: (keyof AdrcliConfig)[] = ['provider', 'model', 'apiKey', 'ollamaUrl', 'outputDir']

export function registerConfigCommand(program: Command): void {
  const cfg = program.command('config').description('Manage adrcli configuration')

  cfg
    .command('set <key> <value>')
    .description('Set a config value')
    .action((key: string, value: string) => {
      if (!VALID_KEYS.includes(key as keyof AdrcliConfig)) {
        console.error(chalk.red(`Unknown key: ${key}`))
        console.error(`Valid keys: ${VALID_KEYS.join(', ')}`)
        process.exit(1)
      }
      saveConfig({ [key]: value })
      console.log(chalk.green(`\u2713 ${key} = ${key === 'apiKey' ? '***' : value}`))
    })

  cfg
    .command('get')
    .description('Show current configuration')
    .action(() => {
      const c = loadConfig()
      console.log(JSON.stringify({ ...c, apiKey: c.apiKey ? '***' : undefined }, null, 2))
    })
}
