import type { ProblemInput } from '../types.js'

export function buildCandidatesPrompt(input: ProblemInput): string {
  const lines: string[] = [
    `You are analyzing a business problem to identify architecture approaches.`,
    ``,
    `**Problem:** ${input.title}`,
    `**Description:** ${input.description}`,
  ]

  if (input.constraints && Object.keys(input.constraints).length > 0) {
    lines.push(`**Constraints:**`)
    for (const [k, v] of Object.entries(input.constraints)) lines.push(`  - ${k}: ${v}`)
  }
  if (input.existingStack?.length) lines.push(`**Existing Stack:** ${input.existingStack.join(', ')}`)
  if (input.successMetrics?.length) {
    lines.push(`**Success Metrics:**`)
    input.successMetrics.forEach(m => lines.push(`  - ${m}`))
  }

  lines.push(
    ``,
    `Generate exactly 4 distinct architecture approaches for this problem.`,
    `Each must represent a meaningfully different paradigm or trade-off profile.`,
    ``,
    `Return ONLY a valid JSON array - no markdown, no code blocks, no explanation:`,
    `[`,
    `  {`,
    `    "name": "Short descriptive name (5-8 words)",`,
    `    "description": "2-3 sentence technical overview",`,
    `    "keyComponents": ["component1", "component2", "component3"],`,
    `    "bestFor": "One sentence on when this approach excels"`,
    `  }`,
    `]`
  )
  return lines.join('\n')
}
