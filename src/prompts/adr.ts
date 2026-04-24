import type { ProblemInput, ArchitectureCandidate, ProsCons } from '../types.js'

export function buildADRPrompt(
  input: ProblemInput,
  candidates: ArchitectureCandidate[],
  prosConsData: ProsCons[]
): string {
  const recommended = prosConsData.reduce((a, b) => b.fitScore > a.fitScore ? b : a)
  const optionsSummary = candidates.map(c => `- **${c.name}**: ${c.bestFor}`).join('\n')

  return [
    `Generate a MADR (Markdown Architectural Decision Record) for this decision.`,
    ``,
    `**Problem:** ${input.title}`,
    `**Recommended:** ${recommended.candidate} (Score: ${recommended.fitScore}/10)`,
    `**Rationale:** ${recommended.recommendation}`,
    ``,
    `**Options considered:**`,
    optionsSummary,
    ``,
    `Write the full ADR in MADR format. Return ONLY the markdown document:`,
    ``,
    `# ADR-001: [Concise decision title]`,
    ``,
    `## Status`,
    `Accepted`,
    ``,
    `## Context`,
    `[Problem context, forces, constraints]`,
    ``,
    `## Decision`,
    `[Decision statement and detailed rationale]`,
    ``,
    `## Consequences`,
    `### Positive`,
    `- [positive consequence]`,
    ``,
    `### Negative / Risks`,
    `- [negative consequence]`,
    ``,
    `## Options Considered`,
    `### [Option name]`,
    `[Why considered, why not chosen]`,
  ].join('\n')
}
