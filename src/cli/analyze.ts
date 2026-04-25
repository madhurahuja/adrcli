import path from 'path'
import chalk from 'chalk'
import ora from 'ora'
import { parseInput } from '../core/input-parser.js'
import { runWorkflow } from '../core/workflow.js'
import { compileReport } from '../core/report-compiler.js'
import { MarkdownRenderer } from '../renderers/markdown.js'
import { HtmlRenderer } from '../renderers/html.js'
import { PdfRenderer } from '../renderers/pdf.js'
import { createProvider } from '../providers/registry.js'
import { printDivider } from './banner.js'
import type { AnalysisContext } from '../types.js'

const STEP_EMOJIS: Record<string, string> = {
  candidates: '\ud83d\udd0d',
  pros:       '\u2696\ufe0f',
  cost:       '\ud83d\udcb0',
  roi:        '\ud83d\udcb0',
  risk:       '\u26a0\ufe0f',
  adr:        '\ud83d\udccb',
  roadmap:    '\ud83d\uddfa\ufe0f',
  diagram:    '\ud83c\udfa8',
}

function getStepEmoji(stepName: string): string {
  const lower = stepName.toLowerCase()
  for (const [key, emoji] of Object.entries(STEP_EMOJIS)) {
    if (lower.includes(key)) return emoji
  }
  return '\u25b8'
}

function printProviderBox(id: string, model?: string, baseUrl?: string): void {
  const W = 36
  const row = (label: string, value: string): string => {
    const raw = `  ${label.padEnd(8)} ${value}`
    const padding = ' '.repeat(Math.max(0, W - raw.length))
    return chalk.dim('\u2502') + `  ${chalk.dim(label.padEnd(8))} ${chalk.white(value)}` + padding + chalk.dim('\u2502')
  }

  console.log()
  console.log(chalk.dim('\u250c\u2500 Provider ' + '\u2500'.repeat(W - 11) + '\u2510'))
  console.log(row('Name:', id))
  if (model) console.log(row('Model:', model))
  if (baseUrl) console.log(row('URL:', baseUrl))
  console.log(chalk.dim('\u2514' + '\u2500'.repeat(W) + '\u2518'))
  console.log()
}

function printRecommendedBox(recommended: string): void {
  const label = `  \u2605  Recommended: ${recommended}  `
  console.log()
  console.log('  ' + chalk.bgCyan.black.bold(label))
  console.log()
}

function chunkString(str: string, maxLen: number): string[] {
  const words = str.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxLen) {
      current = (current + ' ' + word).trim()
    } else {
      if (current) lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines
}

function printErrorBox(message: string, hint?: string): void {
  const W = 54
  const border = '\u2500'.repeat(W)
  console.log()
  console.log(chalk.red('\u250c\u2500\u2500 Error ' + '\u2500'.repeat(W - 7) + '\u2510'))
  for (const line of chunkString(message, W - 4)) {
    console.log(chalk.red('\u2502') + '  ' + chalk.redBright(line.padEnd(W - 2)) + chalk.red('\u2502'))
  }
  if (hint) {
    console.log(chalk.red('\u251c') + chalk.red(border) + chalk.red('\u2524'))
    for (const line of chunkString(hint, W - 4)) {
      console.log(chalk.red('\u2502') + '  ' + chalk.dim(line.padEnd(W - 2)) + chalk.red('\u2502'))
    }
  }
  console.log(chalk.red('\u2514') + chalk.red(border) + chalk.red('\u2518'))
  console.log()
}

function printOutputsTable(outputs: Array<{ path: string; format: string }>): void {
  const icons: Record<string, string> = {
    markdown: '\ud83d\udcc4',
    html:     '\ud83c\udf10',
    pdf:      '\ud83d\udcd1',
  }
  console.log()
  console.log(chalk.green('  Reports generated:'))
  console.log(chalk.dim('  ' + '\u2500'.repeat(62)))
  for (const { path: filePath, format } of outputs) {
    const icon = icons[format] ?? '\ud83d\udcc1'
    console.log(`  ${icon}  ${chalk.underline(filePath)}`)
  }
  console.log(chalk.dim('  ' + '\u2500'.repeat(62)))
}

export async function analyzeCommand(
  promptArg: string | undefined,
  options: { file?: string; interactive?: boolean; out?: string; format?: string }
): Promise<void> {
  const startTime = Date.now()
  const spinner = ora({ color: 'cyan' })
  const fmt = options.format ?? 'markdown'

  try {
    spinner.start('Parsing problem input...')
    const problemInput = await parseInput({
      prompt: promptArg,
      file: options.file,
      interactive: options.interactive,
    })
    spinner.succeed(`Problem: ${chalk.bold(problemInput.title)}`)

    const provider = await createProvider()
    const p = provider as Record<string, unknown>
    printProviderBox(provider.id, p['model'] as string | undefined, p['baseUrl'] as string | undefined)

    printDivider()

    const context: AnalysisContext = {
      input: problemInput,
      candidates: [],
      sections: new Map(),
      sectionData: new Map(),
    }

    let prevDisplay = ''
    await runWorkflow(context, provider, (step, total, current) => {
      if (prevDisplay) spinner.succeed(chalk.dim(prevDisplay))
      const emoji = getStepEmoji(step)
      prevDisplay = `${emoji}  [${current}/${total}] ${step}`
      spinner.start(chalk.dim(prevDisplay + '...'))
    })
    if (prevDisplay) spinner.succeed(chalk.dim(prevDisplay))
    spinner.succeed(chalk.green('Analysis complete'))

    if (context.recommended) {
      printRecommendedBox(context.recommended)
    }

    const report = compileReport(context)
    const outDir = options.out ?? path.join(process.cwd(), 'reports')
    const outputEntries: Array<{ path: string; format: string }> = []

    if (fmt === 'markdown' || fmt === 'all') {
      outputEntries.push({ path: await new MarkdownRenderer().render(report, outDir), format: 'markdown' })
    }
    if (fmt === 'html' || fmt === 'all') {
      outputEntries.push({ path: await new HtmlRenderer().render(report, outDir), format: 'html' })
    }
    if (fmt === 'pdf' || fmt === 'all') {
      outputEntries.push({ path: await new PdfRenderer().render(report, outDir), format: 'pdf' })
    }

    printOutputsTable(outputEntries)

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(
      chalk.dim(
        `  Sections: ${report.sections.length}  |  Candidates: ${report.candidates.length}  |  Time: ${elapsed}s`
      )
    )
    printDivider()
  } catch (err) {
    spinner.fail('Analysis failed')
    const message = err instanceof Error ? err.message : String(err)
    printErrorBox(message, 'Check your provider config: adrcli config get')
    process.exit(1)
  }
}
