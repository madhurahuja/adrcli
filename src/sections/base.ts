import type { LLMProvider } from '../providers/base.js'
import type { AnalysisContext, SectionOutput } from '../types.js'

export interface ReportSection {
  readonly id: string
  readonly title: string
  generate(context: AnalysisContext, provider: LLMProvider): Promise<SectionOutput>
}
