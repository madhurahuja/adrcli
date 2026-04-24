import type { ProblemInput, ArchitectureCandidate } from '../types.js'

export function buildCostROIPrompt(input: ProblemInput, candidates: ArchitectureCandidate[]): string {
  const candidateList = candidates.map((c, i) => `${i + 1}. **${c.name}**: ${c.description}`).join('\n')
  const budget = input.constraints?.['budget'] ?? 'Not specified'
  const timeline = input.constraints?.['timeline'] ?? 'Not specified'

  return [
    `Perform a detailed cost and ROI analysis for architecture candidates.`,
    ``,
    `**Problem:** ${input.title}`,
    `**Budget:** ${budget}`,
    `**Timeline:** ${timeline}`,
    ``,
    `**Candidates:**`,
    candidateList,
    ``,
    `For each candidate estimate infra cost, LLM/AI API costs, implementation effort, ROI.`,
    `Use real industry benchmarks. Be specific.`,
    ``,
    `Return ONLY a valid JSON array:`,
    `[`,
    `  {`,
    `    "candidate": "Exact candidate name",`,
    `    "infraCostMonthly": "$500-800/month",`,
    `    "llmCostMonthly": "$200-400/month",`,
    `    "totalAnnualCost": "$8,400-14,400/year",`,
    `    "implementationCost": "$80,000-120,000",`,
    `    "expectedROI": "3-4x return in year 1",`,
    `    "paybackPeriodMonths": 8,`,
    `    "roiPercentage": 250,`,
    `    "notes": "Primary cost driver is X"`,
    `  }`,
    `]`,
  ].join('\n')
}
