import type { ProblemInput } from '../types.js'

export function buildRoadmapPrompt(input: ProblemInput, recommended: string): string {
  const timeline = input.constraints?.['timeline'] ?? '6 months'
  const teamSize = input.constraints?.['team_size'] ?? 'unspecified'

  return [
    `Create a phased implementation roadmap for this AI architecture.`,
    ``,
    `**Problem:** ${input.title}`,
    `**Architecture:** ${recommended}`,
    `**Timeline:** ${timeline}`,
    `**Team Size:** ${teamSize}`,
    ``,
    `3-4 phases, each independently deliverable. Phase durations must sum to total timeline.`,
    ``,
    `Return ONLY a valid JSON array:`,
    `[`,
    `  {`,
    `    "phase": 1,`,
    `    "name": "Phase name",`,
    `    "duration": "6 weeks",`,
    `    "objectives": ["objective 1", "objective 2"],`,
    `    "deliverables": ["deliverable 1", "deliverable 2"],`,
    `    "dependencies": ["dependency or empty string"],`,
    `    "keyMilestone": "End-of-phase milestone"`,
    `  }`,
    `]`,
  ].join('\n')
}
