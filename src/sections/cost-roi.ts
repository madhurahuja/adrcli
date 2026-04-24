import type { ReportSection } from './base.js'
import type { LLMProvider } from '../providers/base.js'
import type { AnalysisContext, SectionOutput, CostROI } from '../types.js'
import { buildCostROIPrompt } from '../prompts/cost-roi.js'
import { extractJSON } from '../core/utils.js'

function renderCostROI(items: CostROI[]): string {
  const sorted = [...items].sort((a, b) => a.paybackPeriodMonths - b.paybackPeriodMonths)

  const table = [
    `| Architecture | Annual Cost | Impl. Cost | ROI% | Payback |`,
    `|---|---|---|---|---|`,
    ...sorted.map(c =>
      `| **${c.candidate}** | ${c.totalAnnualCost} | ${c.implementationCost} | ${c.roiPercentage}% | ${c.paybackPeriodMonths}mo |`
    ),
  ].join('\n')

  const details = sorted.map(c => [
    `### ${c.candidate}`,
    ``,
    `| Cost Type | Estimate |`,
    `|---|---|`,
    `| Infrastructure (monthly) | ${c.infraCostMonthly} |`,
    `| LLM/AI APIs (monthly) | ${c.llmCostMonthly} |`,
    `| Total Annual | ${c.totalAnnualCost} |`,
    `| Implementation | ${c.implementationCost} |`,
    ``,
    `**Expected ROI:** ${c.expectedROI}`,
    `**Payback Period:** ${c.paybackPeriodMonths} months`,
    `**ROI Percentage:** ${c.roiPercentage}%`,
    ``,
    `> ${c.notes}`,
  ].join('\n')).join('\n\n---\n\n')

  return `### Summary\n\n${table}\n\n---\n\n${details}`
}

export class CostROISection implements ReportSection {
  readonly id = 'cost-roi'
  readonly title = 'Cost & ROI Analysis'

  async generate(context: AnalysisContext, provider: LLMProvider): Promise<SectionOutput> {
    const prompt = buildCostROIPrompt(context.input, context.candidates)
    const raw = await provider.call(prompt, {
      system: 'You are an expert AI solution architect and economist. Return only valid JSON arrays.',
      maxTokens: 3000,
    })
    const data = extractJSON(raw) as CostROI[]
    context.sectionData.set(this.id, data)
    return { id: this.id, title: this.title, content: renderCostROI(data) }
  }
}
