# adrcli

> AI-powered Architecture Decision Record CLI for AI Architects

Analyze any business problem and generate a complete architecture report: candidates, pros/cons, cost/ROI, risk register, MADR ADR, implementation roadmap, and Mermaid diagrams.

## Install

```bash
npm install -g adrcli
```

## Quick Start

```bash
# Set API key (Claude recommended)
adrcli config set apiKey sk-ant-YOUR-KEY

# Analyze from a one-liner
adrcli analyze "Build a real-time fraud detection system for payments"

# Analyze from a structured YAML file
adrcli analyze --file templates/problem.yaml

# Interactive guided input
adrcli analyze --interactive

# Choose output format
adrcli analyze --file problem.yaml --format html
adrcli analyze --file problem.yaml --format all   # markdown + html
```

## Input File Format

```yaml
title: "Customer Churn Prediction"
description: "Predict churn 30 days out using transaction and support data"

constraints:
  budget: "$50k/year"
  timeline: "6 months"
  team_size: 5

stakeholders:
  - role: "Product"
    concern: "Accuracy > 85% F1-score"

successMetrics:
  - "Reduce churn 15% within 6 months"
  - "Inference latency < 200ms p99"

existingStack: ["AWS", "Python", "PostgreSQL"]
```

## Report Sections

| Section | Output |
|---|---|
| Architecture Candidates | 4 distinct approaches |
| Pros & Cons Matrix | Fit scores + tradeoffs |
| Cost & ROI Analysis | Infra + LLM costs, payback |
| Risk Register | Severity-ranked risks + mitigations |
| ADR (MADR format) | Formal decision record |
| Implementation Roadmap | Phased delivery plan |
| Diagrams | Mermaid flowchart + Gantt |

## Configuration

```bash
adrcli config set provider claude      # claude | openai | ollama
adrcli config set model claude-opus-4-6
adrcli config set apiKey sk-ant-...
adrcli config set ollamaUrl http://localhost:11434
adrcli config get
```

Config stored at `~/.adrcli/config.json`.

## LLM Providers

| Provider | Setup |
|---|---|
| `claude` | Set `ANTHROPIC_API_KEY` env var |
| `openai` | Set `OPENAI_API_KEY` env var |
| `ollama` | Run Ollama locally, set `ollamaUrl` |

## PDF Output

PDF requires puppeteer (optional, ~170MB Chromium download):

```bash
npm install puppeteer
adrcli analyze --file problem.yaml --format pdf
```

## Plugin Interfaces

```typescript
// Custom LLM provider
class MyProvider implements LLMProvider {
  readonly id = 'myprovider'
  async call(prompt: string, opts?: LLMOptions): Promise<string> { ... }
}

// Custom report section
class MySection implements ReportSection {
  readonly id = 'my-section'
  readonly title = 'My Analysis'
  async generate(context: AnalysisContext, provider: LLMProvider): Promise<SectionOutput> { ... }
}
```

## License

MIT
