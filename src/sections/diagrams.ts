import type { ReportSection } from './base.js'
import type { LLMProvider } from '../providers/base.js'
import type { AnalysisContext, SectionOutput, RoadmapPhase } from '../types.js'
import { buildArchDiagramPrompt, buildGanttPrompt } from '../prompts/diagrams.js'

function mermaidBlock(raw: string): string {
  const cleaned = raw
    .replace(/^```mermaid\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()
  return `\`\`\`mermaid\n${cleaned}\n\`\`\``
}

export class DiagramsSection implements ReportSection {
  readonly id = 'diagrams'
  readonly title = 'Architecture Diagrams'

  async generate(context: AnalysisContext, provider: LLMProvider): Promise<SectionOutput> {
    const candidate =
      context.candidates.find(c => c.name === context.recommended) ?? context.candidates[0]

    if (!candidate) {
      return { id: this.id, title: this.title, content: '_No architecture candidates available._' }
    }

    const lines: string[] = []

    const archRaw = await provider.call(buildArchDiagramPrompt(context.input, candidate), {
      system: 'You generate Mermaid diagram syntax only. No fences, no explanation, no extra text.',
      maxTokens: 800,
    })
    lines.push(`### System Architecture: ${candidate.name}`, ``, mermaidBlock(archRaw))

    const roadmapData = context.sectionData.get('roadmap') as RoadmapPhase[] | undefined
    if (roadmapData && roadmapData.length > 0) {
      const ganttRaw = await provider.call(buildGanttPrompt(roadmapData), {
        system: 'You generate Mermaid diagram syntax only. No fences, no explanation, no extra text.',
        maxTokens: 600,
      })
      lines.push(``, `### Implementation Timeline`, ``, mermaidBlock(ganttRaw))
    }

    return { id: this.id, title: this.title, content: lines.join('\n') }
  }
}
