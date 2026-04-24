import fs from 'fs'
import path from 'path'
import { marked } from 'marked'
import { MarkdownRenderer } from './markdown.js'
import type { OutputRenderer } from './base.js'
import type { Report } from '../types.js'

const CSS = `
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:960px;margin:0 auto;padding:2rem;color:#1a1a1a;line-height:1.6}
  h1{color:#0f172a;border-bottom:3px solid #3b82f6;padding-bottom:.5rem}
  h2{color:#1e40af;border-bottom:1px solid #e2e8f0;padding-bottom:.25rem;margin-top:2.5rem}
  h3{color:#374151;margin-top:1.5rem}
  table{border-collapse:collapse;width:100%;margin:1rem 0}
  th{background:#1e40af;color:white;padding:.5rem .75rem;text-align:left}
  td{padding:.5rem .75rem;border:1px solid #e2e8f0}
  tr:nth-child(even) td{background:#f8fafc}
  blockquote{border-left:4px solid #3b82f6;margin:0;padding:.5rem 1rem;background:#eff6ff;color:#1e40af}
  code{background:#f1f5f9;padding:.2rem .4rem;border-radius:3px;font-size:.9em}
  pre{background:#0f172a;color:#e2e8f0;padding:1rem;border-radius:6px;overflow-x:auto}
  hr{border:none;border-top:1px solid #e2e8f0;margin:2rem 0}
  .mermaid{background:#fafafa;border:1px solid #e2e8f0;border-radius:6px;padding:1rem;margin:1rem 0;text-align:center}
  @media print{h2{page-break-before:always}.mermaid svg{max-width:100%}}
`

export class HtmlRenderer implements OutputRenderer {
  readonly format = 'html'

  async render(report: Report, outDir: string): Promise<string> {
    fs.mkdirSync(outDir, { recursive: true })

    const mdRenderer = new MarkdownRenderer()
    const mdPath = await mdRenderer.render(report, outDir)
    const mdContent = fs.readFileSync(mdPath, 'utf-8')
    const htmlBody = await marked(mdContent)

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${report.title}</title>
  <style>${CSS}</style>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script>mermaid.initialize({startOnLoad:true,theme:'default',securityLevel:'loose'})</script>
</head>
<body>
${htmlBody}
</body>
</html>`

    const slug = report.problem.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const outPath = path.join(outDir, `${slug}-analysis.html`)
    fs.writeFileSync(outPath, html)
    return outPath
  }
}
