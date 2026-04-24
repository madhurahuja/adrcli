#!/usr/bin/env node
import { Command } from 'commander'
import { analyzeCommand } from './analyze.js'
import { registerConfigCommand } from './config.js'

const program = new Command()

program
  .name('adrcli')
  .description('AI-powered Architecture Decision Record CLI for AI Architects')
  .version('0.1.0')

program
  .command('analyze [prompt]')
  .description('Analyze a business problem and generate an architecture report')
  .option('-f, --file <path>', 'Path to YAML/JSON problem input file')
  .option('-i, --interactive', 'Guided interactive input mode')
  .option('-o, --out <dir>', 'Output directory for reports', './reports')
  .option('--format <fmt>', 'Output format: markdown|html|pdf|all', 'markdown')
  .action(async (prompt?: string, opts?: { file?: string; interactive?: boolean; out?: string; format?: string }) => {
    await analyzeCommand(prompt, opts ?? {})
  })

registerConfigCommand(program)

program.addHelpText('after', `
Examples:
  $ adrcli analyze "Build a customer churn prediction system"
  $ adrcli analyze --file templates/problem.yaml
  $ adrcli analyze --interactive
  $ adrcli config set provider claude
  $ adrcli config set apiKey sk-ant-...
`)

program.parse()
