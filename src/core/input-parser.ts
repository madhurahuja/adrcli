import fs from 'fs'
import yaml from 'js-yaml'
import { input } from '@inquirer/prompts'
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
  if (!obj['title'] || typeof obj['title'] !== 'string') throw new Error('Missing "title" string field')
  if (!obj['description'] || typeof obj['description'] !== 'string') throw new Error('Missing "description" string field')
  return obj as unknown as ProblemInput
}

async function runInteractive(): Promise<ProblemInput> {
  console.log('\nadrcli \u2014 Architecture Analysis\n')
  const title = await input({ message: 'Problem title:', validate: v => v.trim().length > 0 || 'Required' })
  const description = await input({ message: 'Describe the problem:', validate: v => v.trim().length > 10 || 'Min 10 chars' })
  const stackRaw = await input({ message: 'Existing tech stack (comma-separated, or blank):' })
  const budgetRaw = await input({ message: 'Budget constraint (or blank):' })
  const timelineRaw = await input({ message: 'Timeline constraint (or blank):' })
  const metricsRaw = await input({ message: 'Success metrics (comma-separated, or blank):' })

  const result: ProblemInput = { title, description }
  if (stackRaw.trim()) result.existingStack = stackRaw.split(',').map(s => s.trim()).filter(Boolean)
  const constraints: Record<string, string> = {}
  if (budgetRaw.trim()) constraints['budget'] = budgetRaw.trim()
  if (timelineRaw.trim()) constraints['timeline'] = timelineRaw.trim()
  if (Object.keys(constraints).length > 0) result.constraints = constraints
  if (metricsRaw.trim()) result.successMetrics = metricsRaw.split(',').map(s => s.trim()).filter(Boolean)
  return result
}
