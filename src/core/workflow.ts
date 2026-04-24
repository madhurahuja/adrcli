import type { LLMProvider } from '../providers/base.js'
import type { AnalysisContext, ArchitectureCandidate } from '../types.js'
import { buildCandidatesPrompt } from '../prompts/candidates.js'
import { ProsConsSection } from '../sections/pros-cons.js'
import { CostROISection } from '../sections/cost-roi.js'
import { RiskRegisterSection } from '../sections/risk-register.js'
import { ADRSection } from '../sections/adr.js'
import { RoadmapSection } from '../sections/roadmap.js'
import { DiagramsSection } from '../sections/diagrams.js'
import { extractJSON } from './utils.js'

export type ProgressCallback = (step: string, total: number, current: number) => void

const SECTIONS = [
  new ProsConsSection(),
  new CostROISection(),
  new RiskRegisterSection(),
  new ADRSection(),
  new RoadmapSection(),
  new DiagramsSection(),
]

export async function runWorkflow(
  context: AnalysisContext,
  provider: LLMProvider,
  onProgress: ProgressCallback
): Promise<void> {
  const total = 1 + SECTIONS.length

  onProgress('Identifying architecture candidates', total, 1)
  const raw = await provider.call(buildCandidatesPrompt(context.input), {
    system: 'You are an expert AI architect. Return only valid JSON arrays.',
    maxTokens: 2000,
  })

  const candidates = extractJSON(raw) as ArchitectureCandidate[]
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new Error('LLM returned no candidates. Check API key and model.')
  }
  context.candidates = candidates

  for (let i = 0; i < SECTIONS.length; i++) {
    const section = SECTIONS[i]!
    onProgress(section.title, total, 2 + i)
    context.sections.set(section.id, await section.generate(context, provider))
  }
}
