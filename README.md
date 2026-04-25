# `@madhurahuja/adrcli`

[![npm version](https://img.shields.io/npm/v/@madhurahuja/adrcli)](https://www.npmjs.com/package/@madhurahuja/adrcli)
[![GitHub](https://img.shields.io/badge/github-madhurahuja%2Fadrcli-blue)](https://github.com/madhurahuja/adrcli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node >=18](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

**AI-powered Architecture Decision Record CLI for AI Architects.**

`adrcli` takes a one-line business problem (or a structured YAML file) and runs it through a 7-step AI pipeline to produce a complete architecture report: candidate approaches, pros/cons matrix, cost & ROI, risk register, a formal ADR in MADR format, an implementation roadmap, and Mermaid diagrams — all in one command.

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [LLM Providers](#llm-providers)
- [Commands](#commands)
- [Input File Format](#input-file-format)
- [Output Sections](#output-sections)
- [Configuration Reference](#configuration-reference)
- [Plugin Interfaces](#plugin-interfaces)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Installation

```bash
npm install -g @madhurahuja/adrcli
```

Verify:

```bash
adrcli --version
```

**Requires:** Node.js 18+

---

## Quick Start

The default provider is **Ollama** (local, free, private). `adrcli` auto-detects whether Ollama is running and guides you through setup if not.

```bash
adrcli analyze "Build a customer churn prediction system"
```

Produces a full architecture report in `./reports/`.

---

## LLM Providers

### Ollama (default — local, free, private)

Runs AI models on your own machine. No API key. Data stays local.

**Install Ollama:**

```bash
# macOS / Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows — download from https://ollama.com/download

# Docker
docker run -d -p 11434:11434 ollama/ollama
```

**Pull a model and start the server:**

```bash
ollama pull llama3
ollama serve
```

**Configure adrcli (these are already the defaults):**

```bash
adrcli config set provider ollama
adrcli config set model llama3
adrcli config set ollamaUrl http://localhost:11434
```

**Switch to a different local model:**

```bash
ollama pull mistral
adrcli config set model mistral
```

---

### Claude (Anthropic)

```bash
adrcli config set provider claude
adrcli config set apiKey sk-ant-...
```

Optional — choose a specific model:

```bash
adrcli config set model claude-opus-4-6
```

---

### OpenAI

```bash
adrcli config set provider openai
adrcli config set apiKey sk-...
```

Optional — choose a specific model:

```bash
adrcli config set model gpt-4o
```

---

## Commands

### `analyze`

Run the full 7-step architecture analysis pipeline.

```
adrcli analyze [prompt] [options]

Arguments:
  prompt              One-line problem description (optional)

Options:
  -f, --file <path>   Path to YAML/JSON problem input file
  -i, --interactive   Guided wizard — step-by-step input
  -w, --wizard        Alias for --interactive
  -o, --out <dir>     Output directory  (default: ./reports)
  --format <fmt>      markdown | html | pdf | all  (default: markdown)
```

**Examples:**

```bash
# Inline prompt
adrcli analyze "Build a real-time fraud detection system"

# From YAML file, all output formats
adrcli analyze --file problem.yaml --format all

# Interactive wizard
adrcli analyze --interactive

# Wizard with HTML output
adrcli analyze --wizard --format html

# Custom output directory
adrcli analyze "Migrate monolith to microservices" --out ./architecture/decisions
```

---

### `config`

Read and write persistent settings stored in `~/.adrcli/config.json`.

```bash
# Show all settings
adrcli config get

# Set values
adrcli config set provider ollama
adrcli config set model llama3
adrcli config set apiKey sk-ant-...
adrcli config set ollamaUrl http://localhost:11434
adrcli config set outputDir ./reports
```

---

## Input File Format

Use `-f` / `--file` with a YAML or JSON file for structured input.

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

```bash
adrcli analyze --file problem.yaml --format all
```

---

## Output Sections

| Section | What's inside |
|---|---|
| Architecture Candidates | 4 distinct approaches with key components |
| Pros & Cons Matrix | Fit scores, tradeoffs per candidate |
| Cost & ROI | Monthly infra + LLM costs, payback period, ROI % |
| Risk Register | Severity-ranked risks with mitigations and owners |
| ADR (MADR format) | Formal decision record for the recommended approach |
| Implementation Roadmap | Phased delivery plan with milestones |
| Diagrams | Mermaid flowchart + Gantt chart |

---

## Configuration Reference

| Key | Default | Description |
|---|---|---|
| `provider` | `ollama` | LLM provider: `ollama`, `claude`, or `openai` |
| `model` | `llama3` | Model name passed to the provider |
| `apiKey` | _(none)_ | API key for Claude or OpenAI |
| `ollamaUrl` | `http://localhost:11434` | Ollama server base URL |
| `outputDir` | `./reports` | Default output directory |

---

## Plugin Interfaces

Extend the pipeline with custom providers or report sections.

### Custom LLM Provider

```typescript
interface LLMProvider {
  readonly id: string
  call(prompt: string, opts?: LLMOptions): Promise<string>
}
```

### Custom Report Section

```typescript
interface ReportSection {
  readonly id: string
  readonly title: string
  generate(context: AnalysisContext, provider: LLMProvider): Promise<SectionOutput>
}
```

---

## Troubleshooting

### Ollama not running

**Symptom:** `connect ECONNREFUSED 127.0.0.1:11434`

`adrcli` will detect this and offer to start Ollama if it's installed. To start manually:

```bash
ollama serve
```

If Ollama is not installed, download from [https://ollama.com](https://ollama.com).

### Model not found

**Symptom:** `model "llama3" not found`

```bash
ollama pull llama3
```

Switch models:

```bash
ollama pull mistral
adrcli config set model mistral
```

### API key errors

**Symptom:** `401 Unauthorized`

```bash
adrcli config set provider claude
adrcli config set apiKey sk-ant-...
adrcli config get
```

### PDF output fails

PDF requires Puppeteer (headless Chromium, ~170MB):

```bash
npm install -g puppeteer
```

Linux may also need:

```bash
sudo apt-get install -y libgbm-dev libnss3 libatk-bridge2.0-0 libxss1 libasound2
```

---

## License

MIT — see [LICENSE](https://github.com/madhurahuja/adrcli/blob/main/LICENSE) for details.
