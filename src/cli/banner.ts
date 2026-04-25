import chalk from 'chalk'

const ADR_ASCII = [
  '  \u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2557     \u2588\u2588\u2557',
  ' \u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255d\u2588\u2588\u2551     \u2588\u2588\u2551',
  ' \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2551  \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255d\u2588\u2588\u2551     \u2588\u2588\u2551     \u2588\u2588\u2551',
  ' \u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2551\u2588\u2588\u2551  \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551     \u2588\u2588\u2551     \u2588\u2588\u2551',
  ' \u2588\u2588\u2551  \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255d\u2588\u2588\u2551  \u2588\u2588\u2551\u255a\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2551',
  ' \u255a\u2550\u255d  \u255a\u2550\u255d\u255a\u2550\u2550\u2550\u2550\u2550\u255d \u255a\u2550\u255d  \u255a\u2550\u255d \u255a\u2550\u2550\u2550\u2550\u2550\u255d\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u255d\u255a\u2550\u255d',
]

const BANNER_WIDTH = 56

export function printBanner(version: string): void {
  const topBar    = chalk.cyan('\u2554' + '\u2550'.repeat(BANNER_WIDTH) + '\u2557')
  const bottomBar = chalk.cyan('\u255a' + '\u2550'.repeat(BANNER_WIDTH) + '\u255d')
  const emptyLine = chalk.cyan('\u2551') + ' '.repeat(BANNER_WIDTH) + chalk.cyan('\u2551')

  console.log()
  console.log(topBar)
  console.log(emptyLine)

  for (const line of ADR_ASCII) {
    const padded = line.padEnd(BANNER_WIDTH, ' ')
    console.log(chalk.cyan('\u2551') + chalk.bold.cyan(padded) + chalk.cyan('\u2551'))
  }

  console.log(emptyLine)

  const tagline = 'AI Architecture Decision Record CLI'
  const taglinePad = Math.floor((BANNER_WIDTH - tagline.length) / 2)
  const taglineStr =
    ' '.repeat(taglinePad) +
    chalk.dim.white(tagline) +
    ' '.repeat(BANNER_WIDTH - taglinePad - tagline.length)
  console.log(chalk.cyan('\u2551') + taglineStr + chalk.cyan('\u2551'))

  const versionLabel = `v${version}`
  const versionPad = Math.floor((BANNER_WIDTH - versionLabel.length) / 2)
  const versionStr =
    ' '.repeat(versionPad) +
    chalk.bold.blueBright(versionLabel) +
    ' '.repeat(BANNER_WIDTH - versionPad - versionLabel.length)
  console.log(chalk.cyan('\u2551') + versionStr + chalk.cyan('\u2551'))

  console.log(emptyLine)
  console.log(bottomBar)
  console.log()
}

export function printDivider(): void {
  console.log(chalk.dim.cyan('  ' + '\u2500'.repeat(52)))
}

export function printSuccess(msg: string): void {
  console.log(chalk.green('  \u2714 ') + chalk.green(msg))
}

export function printError(msg: string): void {
  console.error(chalk.red('  \u2716 ') + chalk.red(msg))
}

export function printInfo(msg: string): void {
  console.log(chalk.cyan('  \u2192 ') + chalk.dim(msg))
}

export function printStep(step: string, current: number, total: number): string {
  const counter = chalk.dim(`[${current}/${total}]`)
  const diamond = chalk.cyan('\u25c6')
  return `${diamond} ${counter} ${chalk.bold(step)}`
}
