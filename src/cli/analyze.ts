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
import type { AnalysisContext } from '../types.js'

export async function analyzeCommand(
  promptArg: string | undefined,
  options: { file?: string; interactive?: boolean; out?: string; format?: string }
): Promise<void> {
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

    const provider = createProvider()
    console.log(chalk.dim(`  Provider: ${provider.id}`))

    const context: AnalysisContext = {
      input: problemInput,
      candidates: [],
      sections: new Map(),
      sectionData: new Map(),
    }

    await runWorkflow(context, provider, (step, total, current) => {
      spinner.start(`[${current}/${total}] ${step}...`)
    })
    spinner.succeed('Analysis complete')

    if (context.recommended) {
      console.log(chalk.cyan(`  \u2192 Recommended: ${chalk.bold(context.recommended)}`))
    }

    const report = compileReport(context)
    const outDir = options.out ?? path.join(process.cwd(), 'reports')
    const outputs: string[] = []

    if (fmt === 'markdown' || fmt === 'all') {
      outputs.push(await new MarkdownRenderer().render(report, outDir))
    }
    if (fmt === 'html' || fmt === 'all') {
      outputs.push(await new HtmlRenderer().render(report, outDir))
    }
    if (fmt === 'pdf' || fmt === 'all') {
      outputs.push(await new PdfRenderer().render(report, outDir))
    }

    console.log(`\n${chalk.green('\u2713')} Reports generated:`)
    outputs.forEach(p => console.log(`  ${chalk.underline(p)}`))
    console.log(
      chalk.dim(`\n  Sections: ${report.sections.length}  |  Candidates: ${report.candidates.length}`)
    )
  } catch (err) {
    spinner.fail('Analysis failed')
    console.error(chalk.red(`\nError: ${err instanceof Error ? err.message : String(err)}`))
    process.exit(1)
  }
}
