import type { AnalysisContext, Report } from '../types.js'

export function compileReport(context: AnalysisContext): Report {
  return {
    title: `Architecture Analysis: ${context.input.title}`,
    problem: context.input,
    candidates: context.candidates,
    sections: Array.from(context.sections.values()),
    generatedAt: new Date(),
  }
}
