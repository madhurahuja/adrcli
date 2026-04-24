import type { ProblemInput, ArchitectureCandidate } from '../types.js'

export function buildRiskPrompt(
  input: ProblemInput,
  candidates: ArchitectureCandidate[],
  recommended: string
): string {
  return [
    `Generate a comprehensive risk register for implementing this AI architecture.`,
    ``,
    `**Problem:** ${input.title}`,
    `**Recommended Architecture:** ${recommended}`,
    `**Constraints:** ${input.constraints ? JSON.stringify(input.constraints) : 'None'}`,
    ``,
    `Identify 6-8 risks across: Technical, Operational, Business, Compliance.`,
    `Be specific to this problem and architecture.`,
    ``,
    `Return ONLY a valid JSON array:`,
    `[`,
    `  {`,
    `    "title": "Risk title",`,
    `    "category": "Technical",`,
    `    "severity": "High",`,
    `    "likelihood": "Medium",`,
    `    "impact": "Specific impact description",`,
    `    "mitigation": "Concrete mitigation strategy",`,
    `    "owner": "Owner role (e.g. Lead ML Engineer)"`,
    `  }`,
    `]`,
    `severity/likelihood values: Low | Medium | High | Critical`,
  ].join('\n')
}
