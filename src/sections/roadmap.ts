import type { ReportSection } from './base.js'
import type { LLMProvider } from '../providers/base.js'
import type { AnalysisContext, SectionOutput, RoadmapPhase } from '../types.js'
import { buildRoadmapPrompt } from '../prompts/roadmap.js'
import { extractJSON } from '../core/utils.js'

function renderRoadmap(phases: RoadmapPhase[]): string {
  return [...phases].sort((a, b) => a.phase - b.phase).map(p => [
    `### Phase ${p.phase}: ${p.name}`,
    ``,
    `**Duration:** ${p.duration}  |  **Milestone:** ${p.keyMilestone}`,
    ``,
    `**Objectives:**`,
    ...p.objectives.map(o => `- ${o}`),
    ``,
    `**Deliverables:**`,
    ...p.deliverables.map(d => `- ${d}`),
    ...(p.dependencies.length > 0 && p.dependencies[0] !== ''
      ? [``, `**Dependencies:** ${p.dependencies.join(', ')}`]
      : []),
  ].join('\n')).join('\n\n---\n\n')
}

export class RoadmapSection implements ReportSection {
  readonly id = 'roadmap'
  readonly title = 'Implementation Roadmap'

  async generate(context: AnalysisContext, provider: LLMProvider): Promise<SectionOutput> {
    const recommended = context.recommended ?? context.candidates[0]?.name ?? 'Unknown'
    const prompt = buildRoadmapPrompt(context.input, recommended)
    const raw = await provider.call(prompt, {
      system: 'You are an expert AI architect and delivery lead. Return only valid JSON arrays.',
      maxTokens: 2000,
    })
    const data = extractJSON(raw) as RoadmapPhase[]
    context.sectionData.set(this.id, data)
    return { id: this.id, title: this.title, content: renderRoadmap(data) }
  }
}
