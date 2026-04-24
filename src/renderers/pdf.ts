import path from 'path'
import { HtmlRenderer } from './html.js'
import type { OutputRenderer } from './base.js'
import type { Report } from '../types.js'

export class PdfRenderer implements OutputRenderer {
  readonly format = 'pdf'

  async render(report: Report, outDir: string): Promise<string> {
    // Dynamic import — puppeteer is an optional peer dependency
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let puppeteer: any
    try {
      puppeteer = await import('puppeteer')
    } catch {
      throw new Error(
        'PDF output requires puppeteer (not installed).\n' +
          'Install with:  npm install puppeteer\n' +
          'Note: downloads Chromium (~170MB) on first install.'
      )
    }

    const launch = puppeteer.default?.launch ?? puppeteer.launch
    if (typeof launch !== 'function') {
      throw new Error('Could not resolve puppeteer.launch — check puppeteer version.')
    }

    // HTML already includes Mermaid.js CDN for diagram rendering
    const htmlRenderer = new HtmlRenderer()
    const htmlPath = await htmlRenderer.render(report, outDir)

    const browser = await launch({ headless: true })
    try {
      const page = await browser.newPage()
      await page.goto(`file://${path.resolve(htmlPath)}`, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      })
      // Allow Mermaid.js time to render diagrams
      await new Promise(r => setTimeout(r, 3000))

      const slug = report.problem.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const pdfPath = path.join(outDir, `${slug}-analysis.pdf`)

      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '2cm', right: '2cm', bottom: '2cm', left: '2cm' },
      })
      return pdfPath
    } finally {
      await browser.close()
    }
  }
}
