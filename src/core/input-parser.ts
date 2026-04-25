import fs from 'fs'
import yaml from 'js-yaml'
import { input, checkbox, confirm } from '@inquirer/prompts'
import chalk from 'chalk'
import type { ProblemInput } from '../types.js'

export async function parseInput(options: {
  file?: string
  prompt?: string
  interactive?: boolean
}): Promise<ProblemInput> {
  if (options.file) return parseFile(options.file)
  if (options.prompt) return { title: options.prompt, description: options.prompt }
  return runInteractive()
}

function parseFile(filePath: string): ProblemInput {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const ext = filePath.split('.').pop()?.toLowerCase()
  let parsed: unknown
  if (ext === 'yaml' || ext === 'yml') parsed = yaml.load(raw)
  else if (ext === 'json') parsed = JSON.parse(raw)
  else throw new Error(`Unsupported format: .${ext}. Use .yaml or .json`)
  return validateInput(parsed)
}

function validateInput(raw: unknown): ProblemInput {
  if (!raw || typeof raw !== 'object') throw new Error('Input must be an object')
  const obj = raw as Record<string, unknown>
  if (!obj['title'] || typeof obj['title'] !== 'string')
    throw new Error('Missing "title" string field')
  if (!obj['description'] || typeof obj['description'] !== 'string')
    throw new Error('Missing "description" string field')
  return obj as unknown as ProblemInput
}

const COMMON_STACK_OPTIONS = [
  { name: 'AWS', value: 'AWS' },
  { name: 'GCP', value: 'GCP' },
  { name: 'Azure', value: 'Azure' },
  { name: 'Python', value: 'Python' },
  { name: 'Node.js', value: 'Node.js' },
  { name: 'Java', value: 'Java' },
  { name: 'Go', value: 'Go' },
  { name: 'Rust', value: 'Rust' },
  { name: 'PostgreSQL', value: 'PostgreSQL' },
  { name: 'MongoDB', value: 'MongoDB' },
  { name: 'Redis', value: 'Redis' },
  { name: 'Kafka', value: 'Kafka' },
  { name: 'Docker', value: 'Docker' },
  { name: 'Kubernetes', value: 'Kubernetes' },
  { name: 'React', value: 'React' },
  { name: 'Vue', value: 'Vue' },
  { name: 'Other (type below)', value: '__other__' },
]

function printSummaryBox(result: ProblemInput): void {
  const W = 56
  const hr = chalk.cyan('\u2500'.repeat(W))
  const row = (label: string, value: string): string =>
    chalk.cyan('\u2502') +
    `  ${chalk.bold(label.padEnd(18))} ${chalk.white(value)}`.padEnd(W + 10) +
    chalk.cyan('\u2502')

  console.log()
  console.log(chalk.cyan('\u250c' + '\u2500'.repeat(W) + '\u2510'))
  console.log(chalk.cyan('\u2502') + chalk.cyan.bold('  Problem Definition Summary'.padEnd(W)) + chalk.cyan('\u2502'))
  console.log(chalk.cyan('\u251c') + hr + chalk.cyan('\u2524'))
  console.log(row('Title:', result.title))

  const desc = result.description.length > 40
    ? result.description.slice(0, 37) + '...'
    : result.description
  console.log(row('Description:', desc))

  if (result.existingStack && result.existingStack.length > 0) {
    console.log(row('Tech Stack:', result.existingStack.join(', ')))
  }
  if (result.constraints) {
    const parts: string[] = []
    if (result.constraints['budget']) parts.push(`budget: ${result.constraints['budget']}`)
    if (result.constraints['timeline']) parts.push(`timeline: ${result.constraints['timeline']}`)
    if (parts.length > 0) console.log(row('Constraints:', parts.join('  |  ')))
  }
  if (result.successMetrics && result.successMetrics.length > 0) {
    console.log(row('Metrics:', result.successMetrics.join(', ')))
  }

  console.log(chalk.cyan('\u2514' + '\u2500'.repeat(W) + '\u2518'))
  console.log()
}

async function runInteractive(): Promise<ProblemInput> {
  let result: ProblemInput | null = null

  while (!result) {
    console.log()
    console.log(chalk.cyan.bold('  adrcli \u2014 Architecture Decision Record Wizard'))
    console.log(chalk.dim('  Answer the prompts below to define your architecture problem.\n'))

    console.log(chalk.cyan('\u2500\u2500\u2500 Step 1/5: Problem Definition \u2500\u2500\u2500'))
    console.log(chalk.dim('  Give your architecture problem a short, descriptive title.'))
    const title = await input({
      message: 'Problem title:',
      validate: v => v.trim().length > 0 || 'Title is required',
    })

    console.log()
    console.log(chalk.dim('  Describe the problem in detail \u2014 what needs to be solved and why.'))
    const description = await input({
      message: 'Describe the problem:',
      validate: v => v.trim().length > 10 || 'Please provide at least 10 characters',
    })

    console.log()
    console.log(chalk.cyan('\u2500\u2500\u2500 Step 2/5: Existing Tech Stack \u2500\u2500\u2500'))
    console.log(chalk.dim('  Select all technologies already in use. Space to toggle, Enter to confirm.'))
    const stackSelections = await checkbox({
      message: 'Existing tech stack:',
      choices: COMMON_STACK_OPTIONS,
    })

    let existingStack: string[] = stackSelections.filter(s => s !== '__other__')
    if (stackSelections.includes('__other__')) {
      console.log(chalk.dim('  Enter additional technologies not listed above.'))
      const otherRaw = await input({ message: 'Other technologies (comma-separated):' })
      const others = otherRaw.split(',').map(s => s.trim()).filter(Boolean)
      existingStack = [...existingStack, ...others]
    }

    console.log()
    console.log(chalk.cyan('\u2500\u2500\u2500 Step 3/5: Budget Constraint \u2500\u2500\u2500'))
    console.log(chalk.dim('  e.g. "$5k/month", "enterprise budget", "minimal". Leave blank if none.'))
    const budgetRaw = await input({ message: 'Budget constraint (or blank):' })

    console.log()
    console.log(chalk.cyan('\u2500\u2500\u2500 Step 4/5: Timeline Constraint \u2500\u2500\u2500'))
    console.log(chalk.dim('  e.g. "3 months", "Q3 2026", "6 weeks MVP". Leave blank if none.'))
    const timelineRaw = await input({ message: 'Timeline constraint (or blank):' })

    console.log()
    console.log(chalk.cyan('\u2500\u2500\u2500 Step 5/5: Success Metrics \u2500\u2500\u2500'))
    console.log(chalk.dim('  e.g. "99.9% uptime, <200ms p99 latency". Leave blank if none.'))
    const metricsRaw = await input({ message: 'Success metrics (comma-separated, or blank):' })

    const candidate: ProblemInput = { title, description }
    if (existingStack.length > 0) candidate.existingStack = existingStack
    const constraints: Record<string, string> = {}
    if (budgetRaw.trim()) constraints['budget'] = budgetRaw.trim()
    if (timelineRaw.trim()) constraints['timeline'] = timelineRaw.trim()
    if (Object.keys(constraints).length > 0) candidate.constraints = constraints
    if (metricsRaw.trim())
      candidate.successMetrics = metricsRaw.split(',').map(s => s.trim()).filter(Boolean)

    printSummaryBox(candidate)

    const proceed = await confirm({
      message: 'Proceed with this problem definition?',
      default: true,
    })

    if (proceed) {
      result = candidate
    } else {
      console.log()
      console.log(chalk.yellow('  Restarting wizard...\n'))
    }
  }

  return result
}
