import type { ReportSection } from './base.js'
import type { LLMProvider } from '../providers/base.js'
import type { AnalysisContext, SectionOutput, ProsCons } from '../types.js'
import { buildProsConsPrompt } from '../prompts/pros-cons.js'
import { extractJSON } from '../core/utils.js'

function renderProsCons(items: ProsCons[]): string {
  return items.map(item => {
    const maxRows = Math.max(item.pros.length, item.cons.length)
    const tableRows = Array.from({ length: maxRows }, (_, i) => {
      const pro = item.pros[i] ? `\u2705 ${item.pros[i]}` : ''
      const con = item.cons[i] ? `\u274c ${item.cons[i]}` : ''
      return `| ${pro} | ${con} |`
    })
    return [
      `### ${item.candidate}`,
      ``,
      `**Fit Score:** ${item.fitScore}/10`,
      ``,
      `| Pros | Cons |`,
      `|------|------|`,
      ...tableRows,
      ``,
      `**Key Tradeoff:** ${item.tradeoffs}`,
      ``,
      `**Recommendation:** ${item.recommendation}`,
    ].join('\n')
  }).join('\n\n---\n\n')
}

export class ProsConsSection implements ReportSection {
  readonly id = 'pros-cons'
  readonly title = 'Architecture Comparison \u2014 Pros & Cons'

  async generate(context: AnalysisContext, provider: LLMProvider): Promise<SectionOutput> {
    const prompt = buildProsConsPrompt(context.input, context.candidates)
    const raw = await provider.call(prompt, {
      system: 'You are an expert AI architect. Return only valid JSON arrays.',
      maxTokens: 3000,
    })
    const data = extractJSON(raw) as ProsCons[]
    context.sectionData.set(this.id, data)
    const best = data.reduce((a, b) => b.fitScore > a.fitScore ? b : a)
    context.recommended = best.candidate
    return { id: this.id, title: this.title, content: renderProsCons(data) }
  }
}
