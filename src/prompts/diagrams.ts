import type { ProblemInput, ArchitectureCandidate, RoadmapPhase } from '../types.js'

export function buildArchDiagramPrompt(input: ProblemInput, candidate: ArchitectureCandidate): string {
  return [
    `Generate a Mermaid flowchart diagram for this AI architecture system.`,
    ``,
    `**System:** ${candidate.name}`,
    `**Problem:** ${input.title}`,
    `**Key Components:** ${candidate.keyComponents.join(', ')}`,
    ``,
    `Show data flow from input to output, key components, and integrations.`,
    `Use clear labels. Max 12 nodes.`,
    ``,
    `Return ONLY raw Mermaid syntax starting with "flowchart TD".`,
    `No markdown fences, no explanation, no extra text.`,
  ].join('\n')
}

export function buildGanttPrompt(phases: RoadmapPhase[]): string {
  const today = new Date().toISOString().split('T')[0]!
  const phaseList = phases.map(p => `  Phase ${p.phase} - ${p.name}: ${p.duration}`).join('\n')

  return [
    `Generate a Mermaid Gantt chart for this implementation roadmap.`,
    ``,
    `Start date: ${today}`,
    `Phases:`,
    phaseList,
    ``,
    `Return ONLY raw Mermaid syntax starting with "gantt".`,
    `No markdown fences, no explanation. Use sequential dates, dateFormat YYYY-MM-DD.`,
  ].join('\n')
}
