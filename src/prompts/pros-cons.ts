import type { ProblemInput, ArchitectureCandidate } from '../types.js'

export function buildProsConsPrompt(input: ProblemInput, candidates: ArchitectureCandidate[]): string {
  const candidateList = candidates.map((c, i) => `${i + 1}. **${c.name}**: ${c.description}`).join('\n')
  const constraintsStr = input.constraints ? JSON.stringify(input.constraints) : 'None specified'

  return [
    `Perform a detailed pros/cons analysis for architecture candidates.`,
    ``,
    `**Problem:** ${input.title}`,
    `**Description:** ${input.description}`,
    `**Constraints:** ${constraintsStr}`,
    ``,
    `**Architecture Candidates:**`,
    candidateList,
    ``,
    `Evaluate each candidate against the specific constraints and success criteria.`,
    ``,
    `Return ONLY a valid JSON array - no markdown, no code blocks:`,
    `[`,
    `  {`,
    `    "candidate": "Exact candidate name from above",`,
    `    "pros": ["specific pro 1", "specific pro 2", "specific pro 3"],`,
    `    "cons": ["specific con 1", "specific con 2", "specific con 3"],`,
    `    "tradeoffs": "Primary engineering tradeoff in one sentence",`,
    `    "fitScore": 8,`,
    `    "recommendation": "One sentence on when to choose this"`,
    `  }`,
    `]`,
    `fitScore: 1-10 fit rating for THIS specific problem.`,
  ].join('\n')
}
