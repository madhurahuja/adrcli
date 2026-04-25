// Suppress DEP0040 punycode deprecation warning from transitive dependencies
process.removeAllListeners('warning')
process.on('warning', (warning) => {
  if (warning.name === 'DeprecationWarning' && warning.message.includes('punycode')) return
  process.stderr.write(`${warning.name}: ${warning.message}\n`)
})

import { Command } from 'commander'
import { analyzeCommand } from './analyze.js'
import { registerConfigCommand } from './config.js'
import { printBanner } from './banner.js'

const VERSION = '0.1.2'

const program = new Command()

program
  .name('adrcli')
  .description('AI-powered Architecture Decision Record CLI for AI Architects')
  .version(VERSION)

program
  .command('analyze [prompt]')
  .description('Analyze a business problem and generate a comprehensive architecture decision report')
  .option(
    '-f, --file <path>',
    'Path to a YAML or JSON file describing the problem (see templates/problem.yaml)'
  )
  .option(
    '-i, --interactive',
    'Launch the guided wizard — step-by-step prompts for constraints, goals, and context'
  )
  .option(
    '-w, --wizard',
    'Alias for --interactive: launch the guided input wizard'
  )
  .option(
    '-o, --out <dir>',
    'Output directory where generated reports will be written',
    './reports'
  )
  .option(
    '--format <fmt>',
    'Output format: markdown | html | pdf | all',
    'markdown'
  )
  .action(async (
    prompt?: string,
    opts?: {
      file?: string
      interactive?: boolean
      wizard?: boolean
      out?: string
      format?: string
    }
  ) => {
    const resolvedOpts = opts ?? {}
    if (resolvedOpts.wizard) resolvedOpts.interactive = true
    await analyzeCommand(prompt, resolvedOpts)
  })

registerConfigCommand(program)

program.addHelpText('after', `
Examples:

  Analyze from a one-line prompt:
    $ adrcli analyze "Build a real-time fraud detection system"

  Analyze from a structured YAML file:
    $ adrcli analyze --file templates/problem.yaml

  Launch the interactive wizard:
    $ adrcli analyze --interactive
    $ adrcli analyze --wizard

  Choose output format:
    $ adrcli analyze "Event-driven order service" --format html
    $ adrcli analyze --file problem.yaml --format all

  Write reports to a custom directory:
    $ adrcli analyze --file problem.yaml --out ./architecture/decisions

  Configure your LLM provider:
    $ adrcli config set provider ollama        # default, local, free
    $ adrcli config set provider claude
    $ adrcli config set apiKey sk-ant-...
    $ adrcli config get
`)

printBanner(VERSION)
program.parse()
