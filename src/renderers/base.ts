import type { Report } from '../types.js'

export interface OutputRenderer {
  readonly format: string
  render(report: Report, outDir: string): Promise<string>
}
