import type { ReportSection } from './base.js'
import type { LLMProvider } from '../providers/base.js'
import type { AnalysisContext, SectionOutput, Risk } from '../types.js'
import { buildRiskPrompt } from '../prompts/risk.js'
import { extractJSON } from '../core/utils.js'

const SEV: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 }

function badge(level: string): string {
  const map: Record<string, string> = { Critical: '\u{1F534}', High: '\u{1F7E0}', Medium: '\u{1F7E1}', Low: '\u{1F7E2}' }
  return `${map[level] ?? ''} ${level}`
}

function renderRiskRegister(risks: Risk[]): string {
  const sorted = [...risks].sort((a, b) => (SEV[b.severity] ?? 0) - (SEV[a.severity] ?? 0))

  const table = [
    `| Risk | Category | Severity | Likelihood | Owner |`,
    `|---|---|---|---|---|`,
    ...sorted.map(r => `| ${r.title} | ${r.category} | ${badge(r.severity)} | ${r.likelihood} | ${r.owner} |`),
  ].join('\n')

  const details = sorted.map(r => [
    `### ${badge(r.severity)} ${r.title}`,
    ``,
    `**Category:** ${r.category}  |  **Likelihood:** ${r.likelihood}  |  **Owner:** ${r.owner}`,
    ``,
    `**Impact:** ${r.impact}`,
    ``,
    `**Mitigation:** ${r.mitigation}`,
  ].join('\n')).join('\n\n---\n\n')

  return `### Risk Summary\n\n${table}\n\n---\n\n### Risk Details\n\n${details}`
}

export class RiskRegisterSection implements ReportSection {
  readonly id = 'risk-register'
  readonly title = 'Risk Register'

  async generate(context: AnalysisContext, provider: LLMProvider): Promise<SectionOutput> {
    const recommended = context.recommended ?? context.candidates[0]?.name ?? 'Unknown'
    const prompt = buildRiskPrompt(context.input, context.candidates, recommended)
    const raw = await provider.call(prompt, {
      system: 'You are an expert risk analyst and AI architect. Return only valid JSON arrays.',
      maxTokens: 3000,
    })
    const data = extractJSON(raw) as Risk[]
    context.sectionData.set(this.id, data)
    return { id: this.id, title: this.title, content: renderRiskRegister(data) }
  }
}
