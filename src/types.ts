export interface ProblemInput {
  title: string
  description: string
  constraints?: Record<string, string | number>
  stakeholders?: Array<{ role: string; concern: string }>
  successMetrics?: string[]
  existingStack?: string[]
}

export interface ArchitectureCandidate {
  name: string
  description: string
  keyComponents: string[]
  bestFor: string
}

export interface ProsCons {
  candidate: string
  pros: string[]
  cons: string[]
  tradeoffs: string
  fitScore: number
  recommendation: string
}

export interface CostROI {
  candidate: string
  infraCostMonthly: string
  llmCostMonthly: string
  totalAnnualCost: string
  implementationCost: string
  expectedROI: string
  paybackPeriodMonths: number
  roiPercentage: number
  notes: string
}

export interface Risk {
  title: string
  category: string
  severity: 'Low' | 'Medium' | 'High' | 'Critical'
  likelihood: 'Low' | 'Medium' | 'High'
  impact: string
  mitigation: string
  owner: string
}

export interface RoadmapPhase {
  phase: number
  name: string
  duration: string
  objectives: string[]
  deliverables: string[]
  dependencies: string[]
  keyMilestone: string
}

export interface SectionOutput {
  id: string
  title: string
  content: string
}

export interface Report {
  title: string
  problem: ProblemInput
  candidates: ArchitectureCandidate[]
  sections: SectionOutput[]
  generatedAt: Date
}

export interface AnalysisContext {
  input: ProblemInput
  candidates: ArchitectureCandidate[]
  sections: Map<string, SectionOutput>
  sectionData: Map<string, unknown>
  recommended?: string
}

export interface LLMOptions {
  maxTokens?: number
  temperature?: number
  system?: string
}

export interface AdrcliConfig {
  provider: 'claude' | 'openai' | 'ollama' | 'unsloth'
  model?: string
  apiKey?: string
  ollamaUrl?: string
  unslothUrl?: string
  outputDir?: string
}
