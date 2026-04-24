import type { ReportSection } from './base.js'
import type { LLMProvider } from '../providers/base.js'
import type { AnalysisContext, SectionOutput, ProsCons } from '../types.js'
import { buildADRPrompt } from '../prompts/adr.js'

export class ADRSection implements ReportSection {
  readonly id = 'adr'
  readonly title = 'Architecture Decision Record (MADR)'

  async generate(context: AnalysisContext, provider: LLMProvider): Promise<SectionOutput> {
    const prosConsData = (context.sectionData.get('pros-cons') ?? []) as ProsCons[]
    const prompt = buildADRPrompt(context.input, context.candidates, prosConsData)
    const content = await provider.call(prompt, {
      system: 'You are an expert software architect writing formal ADRs. Return only the MADR markdown document.',
      maxTokens: 2000,
    })
    return { id: this.id, title: this.title, content }
  }
}
