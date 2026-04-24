#!/usr/bin/env node
#!/usr/bin/env node

// src/cli/index.ts
import { Command } from "commander";

// src/cli/analyze.ts
import path5 from "path";
import chalk from "chalk";
import ora from "ora";

// src/core/input-parser.ts
import fs from "fs";
import yaml from "js-yaml";
import { input } from "@inquirer/prompts";
async function parseInput(options) {
  if (options.file) return parseFile(options.file);
  if (options.prompt) return { title: options.prompt, description: options.prompt };
  return runInteractive();
}
function parseFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const ext = filePath.split(".").pop()?.toLowerCase();
  let parsed;
  if (ext === "yaml" || ext === "yml") parsed = yaml.load(raw);
  else if (ext === "json") parsed = JSON.parse(raw);
  else throw new Error(`Unsupported format: .${ext}. Use .yaml or .json`);
  return validateInput(parsed);
}
function validateInput(raw) {
  if (!raw || typeof raw !== "object") throw new Error("Input must be an object");
  const obj = raw;
  if (!obj["title"] || typeof obj["title"] !== "string") throw new Error('Missing "title" string field');
  if (!obj["description"] || typeof obj["description"] !== "string") throw new Error('Missing "description" string field');
  return obj;
}
async function runInteractive() {
  console.log("\nadrcli \u2014 Architecture Analysis\n");
  const title = await input({ message: "Problem title:", validate: (v) => v.trim().length > 0 || "Required" });
  const description = await input({ message: "Describe the problem:", validate: (v) => v.trim().length > 10 || "Min 10 chars" });
  const stackRaw = await input({ message: "Existing tech stack (comma-separated, or blank):" });
  const budgetRaw = await input({ message: "Budget constraint (or blank):" });
  const timelineRaw = await input({ message: "Timeline constraint (or blank):" });
  const metricsRaw = await input({ message: "Success metrics (comma-separated, or blank):" });
  const result = { title, description };
  if (stackRaw.trim()) result.existingStack = stackRaw.split(",").map((s) => s.trim()).filter(Boolean);
  const constraints = {};
  if (budgetRaw.trim()) constraints["budget"] = budgetRaw.trim();
  if (timelineRaw.trim()) constraints["timeline"] = timelineRaw.trim();
  if (Object.keys(constraints).length > 0) result.constraints = constraints;
  if (metricsRaw.trim()) result.successMetrics = metricsRaw.split(",").map((s) => s.trim()).filter(Boolean);
  return result;
}

// src/prompts/candidates.ts
function buildCandidatesPrompt(input2) {
  const lines = [
    `You are analyzing a business problem to identify architecture approaches.`,
    ``,
    `**Problem:** ${input2.title}`,
    `**Description:** ${input2.description}`
  ];
  if (input2.constraints && Object.keys(input2.constraints).length > 0) {
    lines.push(`**Constraints:**`);
    for (const [k, v] of Object.entries(input2.constraints)) lines.push(`  - ${k}: ${v}`);
  }
  if (input2.existingStack?.length) lines.push(`**Existing Stack:** ${input2.existingStack.join(", ")}`);
  if (input2.successMetrics?.length) {
    lines.push(`**Success Metrics:**`);
    input2.successMetrics.forEach((m) => lines.push(`  - ${m}`));
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
  );
  return lines.join("\n");
}

// src/prompts/pros-cons.ts
function buildProsConsPrompt(input2, candidates) {
  const candidateList = candidates.map((c, i) => `${i + 1}. **${c.name}**: ${c.description}`).join("\n");
  const constraintsStr = input2.constraints ? JSON.stringify(input2.constraints) : "None specified";
  return [
    `Perform a detailed pros/cons analysis for architecture candidates.`,
    ``,
    `**Problem:** ${input2.title}`,
    `**Description:** ${input2.description}`,
    `**Constraints:** ${constraintsStr}`,
    ``,
    `**Architecture Candidates:**`,
    candidateList,
    ``,
    `Evaluate each candidate against the specific constraints and success criteria.`,
    ``,
    `Return ONLY a valid JSON array - no markdown, no code blocks:`,
    `[`,
    `  {`,
    `    "candidate": "Exact candidate name from above",`,
    `    "pros": ["specific pro 1", "specific pro 2", "specific pro 3"],`,
    `    "cons": ["specific con 1", "specific con 2", "specific con 3"],`,
    `    "tradeoffs": "Primary engineering tradeoff in one sentence",`,
    `    "fitScore": 8,`,
    `    "recommendation": "One sentence on when to choose this"`,
    `  }`,
    `]`,
    `fitScore: 1-10 fit rating for THIS specific problem.`
  ].join("\n");
}

// src/core/utils.ts
function extractJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
  }
  const block = text.match(/```(?:json)?\s*([\s\S]+?)```/);
  if (block?.[1]) return JSON.parse(block[1].trim());
  const arr = text.match(/\[[\s\S]+\]/);
  if (arr?.[0]) return JSON.parse(arr[0]);
  throw new Error(`Could not extract JSON from LLM response:
${text.slice(0, 400)}`);
}

// src/sections/pros-cons.ts
function renderProsCons(items) {
  return items.map((item) => {
    const maxRows = Math.max(item.pros.length, item.cons.length);
    const tableRows = Array.from({ length: maxRows }, (_, i) => {
      const pro = item.pros[i] ? `\u2705 ${item.pros[i]}` : "";
      const con = item.cons[i] ? `\u274C ${item.cons[i]}` : "";
      return `| ${pro} | ${con} |`;
    });
    return [
      `### ${item.candidate}`,
      ``,
      `**Fit Score:** ${item.fitScore}/10`,
      ``,
      `| Pros | Cons |`,
      `|------|------|`,
      ...tableRows,
      ``,
      `**Key Tradeoff:** ${item.tradeoffs}`,
      ``,
      `**Recommendation:** ${item.recommendation}`
    ].join("\n");
  }).join("\n\n---\n\n");
}
var ProsConsSection = class {
  id = "pros-cons";
  title = "Architecture Comparison \u2014 Pros & Cons";
  async generate(context, provider) {
    const prompt = buildProsConsPrompt(context.input, context.candidates);
    const raw = await provider.call(prompt, {
      system: "You are an expert AI architect. Return only valid JSON arrays.",
      maxTokens: 3e3
    });
    const data = extractJSON(raw);
    context.sectionData.set(this.id, data);
    const best = data.reduce((a, b) => b.fitScore > a.fitScore ? b : a);
    context.recommended = best.candidate;
    return { id: this.id, title: this.title, content: renderProsCons(data) };
  }
};

// src/prompts/cost-roi.ts
function buildCostROIPrompt(input2, candidates) {
  const candidateList = candidates.map((c, i) => `${i + 1}. **${c.name}**: ${c.description}`).join("\n");
  const budget = input2.constraints?.["budget"] ?? "Not specified";
  const timeline = input2.constraints?.["timeline"] ?? "Not specified";
  return [
    `Perform a detailed cost and ROI analysis for architecture candidates.`,
    ``,
    `**Problem:** ${input2.title}`,
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
    `]`
  ].join("\n");
}

// src/sections/cost-roi.ts
function renderCostROI(items) {
  const sorted = [...items].sort((a, b) => a.paybackPeriodMonths - b.paybackPeriodMonths);
  const table = [
    `| Architecture | Annual Cost | Impl. Cost | ROI% | Payback |`,
    `|---|---|---|---|---|`,
    ...sorted.map(
      (c) => `| **${c.candidate}** | ${c.totalAnnualCost} | ${c.implementationCost} | ${c.roiPercentage}% | ${c.paybackPeriodMonths}mo |`
    )
  ].join("\n");
  const details = sorted.map((c) => [
    `### ${c.candidate}`,
    ``,
    `| Cost Type | Estimate |`,
    `|---|---|`,
    `| Infrastructure (monthly) | ${c.infraCostMonthly} |`,
    `| LLM/AI APIs (monthly) | ${c.llmCostMonthly} |`,
    `| Total Annual | ${c.totalAnnualCost} |`,
    `| Implementation | ${c.implementationCost} |`,
    ``,
    `**Expected ROI:** ${c.expectedROI}`,
    `**Payback Period:** ${c.paybackPeriodMonths} months`,
    `**ROI Percentage:** ${c.roiPercentage}%`,
    ``,
    `> ${c.notes}`
  ].join("\n")).join("\n\n---\n\n");
  return `### Summary

${table}

---

${details}`;
}
var CostROISection = class {
  id = "cost-roi";
  title = "Cost & ROI Analysis";
  async generate(context, provider) {
    const prompt = buildCostROIPrompt(context.input, context.candidates);
    const raw = await provider.call(prompt, {
      system: "You are an expert AI solution architect and economist. Return only valid JSON arrays.",
      maxTokens: 3e3
    });
    const data = extractJSON(raw);
    context.sectionData.set(this.id, data);
    return { id: this.id, title: this.title, content: renderCostROI(data) };
  }
};

// src/prompts/risk.ts
function buildRiskPrompt(input2, candidates, recommended) {
  return [
    `Generate a comprehensive risk register for implementing this AI architecture.`,
    ``,
    `**Problem:** ${input2.title}`,
    `**Recommended Architecture:** ${recommended}`,
    `**Constraints:** ${input2.constraints ? JSON.stringify(input2.constraints) : "None"}`,
    ``,
    `Identify 6-8 risks across: Technical, Operational, Business, Compliance.`,
    `Be specific to this problem and architecture.`,
    ``,
    `Return ONLY a valid JSON array:`,
    `[`,
    `  {`,
    `    "title": "Risk title",`,
    `    "category": "Technical",`,
    `    "severity": "High",`,
    `    "likelihood": "Medium",`,
    `    "impact": "Specific impact description",`,
    `    "mitigation": "Concrete mitigation strategy",`,
    `    "owner": "Owner role (e.g. Lead ML Engineer)"`,
    `  }`,
    `]`,
    `severity/likelihood values: Low | Medium | High | Critical`
  ].join("\n");
}

// src/sections/risk-register.ts
var SEV = { Critical: 4, High: 3, Medium: 2, Low: 1 };
function badge(level) {
  const map = { Critical: "\u{1F534}", High: "\u{1F7E0}", Medium: "\u{1F7E1}", Low: "\u{1F7E2}" };
  return `${map[level] ?? ""} ${level}`;
}
function renderRiskRegister(risks) {
  const sorted = [...risks].sort((a, b) => (SEV[b.severity] ?? 0) - (SEV[a.severity] ?? 0));
  const table = [
    `| Risk | Category | Severity | Likelihood | Owner |`,
    `|---|---|---|---|---|`,
    ...sorted.map((r) => `| ${r.title} | ${r.category} | ${badge(r.severity)} | ${r.likelihood} | ${r.owner} |`)
  ].join("\n");
  const details = sorted.map((r) => [
    `### ${badge(r.severity)} ${r.title}`,
    ``,
    `**Category:** ${r.category}  |  **Likelihood:** ${r.likelihood}  |  **Owner:** ${r.owner}`,
    ``,
    `**Impact:** ${r.impact}`,
    ``,
    `**Mitigation:** ${r.mitigation}`
  ].join("\n")).join("\n\n---\n\n");
  return `### Risk Summary

${table}

---

### Risk Details

${details}`;
}
var RiskRegisterSection = class {
  id = "risk-register";
  title = "Risk Register";
  async generate(context, provider) {
    const recommended = context.recommended ?? context.candidates[0]?.name ?? "Unknown";
    const prompt = buildRiskPrompt(context.input, context.candidates, recommended);
    const raw = await provider.call(prompt, {
      system: "You are an expert risk analyst and AI architect. Return only valid JSON arrays.",
      maxTokens: 3e3
    });
    const data = extractJSON(raw);
    context.sectionData.set(this.id, data);
    return { id: this.id, title: this.title, content: renderRiskRegister(data) };
  }
};

// src/prompts/adr.ts
function buildADRPrompt(input2, candidates, prosConsData) {
  const recommended = prosConsData.reduce((a, b) => b.fitScore > a.fitScore ? b : a);
  const optionsSummary = candidates.map((c) => `- **${c.name}**: ${c.bestFor}`).join("\n");
  return [
    `Generate a MADR (Markdown Architectural Decision Record) for this decision.`,
    ``,
    `**Problem:** ${input2.title}`,
    `**Recommended:** ${recommended.candidate} (Score: ${recommended.fitScore}/10)`,
    `**Rationale:** ${recommended.recommendation}`,
    ``,
    `**Options considered:**`,
    optionsSummary,
    ``,
    `Write the full ADR in MADR format. Return ONLY the markdown document:`,
    ``,
    `# ADR-001: [Concise decision title]`,
    ``,
    `## Status`,
    `Accepted`,
    ``,
    `## Context`,
    `[Problem context, forces, constraints]`,
    ``,
    `## Decision`,
    `[Decision statement and detailed rationale]`,
    ``,
    `## Consequences`,
    `### Positive`,
    `- [positive consequence]`,
    ``,
    `### Negative / Risks`,
    `- [negative consequence]`,
    ``,
    `## Options Considered`,
    `### [Option name]`,
    `[Why considered, why not chosen]`
  ].join("\n");
}

// src/sections/adr.ts
var ADRSection = class {
  id = "adr";
  title = "Architecture Decision Record (MADR)";
  async generate(context, provider) {
    const prosConsData = context.sectionData.get("pros-cons") ?? [];
    const prompt = buildADRPrompt(context.input, context.candidates, prosConsData);
    const content = await provider.call(prompt, {
      system: "You are an expert software architect writing formal ADRs. Return only the MADR markdown document.",
      maxTokens: 2e3
    });
    return { id: this.id, title: this.title, content };
  }
};

// src/prompts/roadmap.ts
function buildRoadmapPrompt(input2, recommended) {
  const timeline = input2.constraints?.["timeline"] ?? "6 months";
  const teamSize = input2.constraints?.["team_size"] ?? "unspecified";
  return [
    `Create a phased implementation roadmap for this AI architecture.`,
    ``,
    `**Problem:** ${input2.title}`,
    `**Architecture:** ${recommended}`,
    `**Timeline:** ${timeline}`,
    `**Team Size:** ${teamSize}`,
    ``,
    `3-4 phases, each independently deliverable. Phase durations must sum to total timeline.`,
    ``,
    `Return ONLY a valid JSON array:`,
    `[`,
    `  {`,
    `    "phase": 1,`,
    `    "name": "Phase name",`,
    `    "duration": "6 weeks",`,
    `    "objectives": ["objective 1", "objective 2"],`,
    `    "deliverables": ["deliverable 1", "deliverable 2"],`,
    `    "dependencies": ["dependency or empty string"],`,
    `    "keyMilestone": "End-of-phase milestone"`,
    `  }`,
    `]`
  ].join("\n");
}

// src/sections/roadmap.ts
function renderRoadmap(phases) {
  return [...phases].sort((a, b) => a.phase - b.phase).map((p) => [
    `### Phase ${p.phase}: ${p.name}`,
    ``,
    `**Duration:** ${p.duration}  |  **Milestone:** ${p.keyMilestone}`,
    ``,
    `**Objectives:**`,
    ...p.objectives.map((o) => `- ${o}`),
    ``,
    `**Deliverables:**`,
    ...p.deliverables.map((d) => `- ${d}`),
    ...p.dependencies.length > 0 && p.dependencies[0] !== "" ? [``, `**Dependencies:** ${p.dependencies.join(", ")}`] : []
  ].join("\n")).join("\n\n---\n\n");
}
var RoadmapSection = class {
  id = "roadmap";
  title = "Implementation Roadmap";
  async generate(context, provider) {
    const recommended = context.recommended ?? context.candidates[0]?.name ?? "Unknown";
    const prompt = buildRoadmapPrompt(context.input, recommended);
    const raw = await provider.call(prompt, {
      system: "You are an expert AI architect and delivery lead. Return only valid JSON arrays.",
      maxTokens: 2e3
    });
    const data = extractJSON(raw);
    context.sectionData.set(this.id, data);
    return { id: this.id, title: this.title, content: renderRoadmap(data) };
  }
};

// src/prompts/diagrams.ts
function buildArchDiagramPrompt(input2, candidate) {
  return [
    `Generate a Mermaid flowchart diagram for this AI architecture system.`,
    ``,
    `**System:** ${candidate.name}`,
    `**Problem:** ${input2.title}`,
    `**Key Components:** ${candidate.keyComponents.join(", ")}`,
    ``,
    `Show data flow from input to output, key components, and integrations.`,
    `Use clear labels. Max 12 nodes.`,
    ``,
    `Return ONLY raw Mermaid syntax starting with "flowchart TD".`,
    `No markdown fences, no explanation, no extra text.`
  ].join("\n");
}
function buildGanttPrompt(phases) {
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const phaseList = phases.map((p) => `  Phase ${p.phase} - ${p.name}: ${p.duration}`).join("\n");
  return [
    `Generate a Mermaid Gantt chart for this implementation roadmap.`,
    ``,
    `Start date: ${today}`,
    `Phases:`,
    phaseList,
    ``,
    `Return ONLY raw Mermaid syntax starting with "gantt".`,
    `No markdown fences, no explanation. Use sequential dates, dateFormat YYYY-MM-DD.`
  ].join("\n");
}

// src/sections/diagrams.ts
function mermaidBlock(raw) {
  const cleaned = raw.replace(/^```mermaid\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
  return `\`\`\`mermaid
${cleaned}
\`\`\``;
}
var DiagramsSection = class {
  id = "diagrams";
  title = "Architecture Diagrams";
  async generate(context, provider) {
    const candidate = context.candidates.find((c) => c.name === context.recommended) ?? context.candidates[0];
    if (!candidate) {
      return { id: this.id, title: this.title, content: "_No architecture candidates available._" };
    }
    const lines = [];
    const archRaw = await provider.call(buildArchDiagramPrompt(context.input, candidate), {
      system: "You generate Mermaid diagram syntax only. No fences, no explanation, no extra text.",
      maxTokens: 800
    });
    lines.push(`### System Architecture: ${candidate.name}`, ``, mermaidBlock(archRaw));
    const roadmapData = context.sectionData.get("roadmap");
    if (roadmapData && roadmapData.length > 0) {
      const ganttRaw = await provider.call(buildGanttPrompt(roadmapData), {
        system: "You generate Mermaid diagram syntax only. No fences, no explanation, no extra text.",
        maxTokens: 600
      });
      lines.push(``, `### Implementation Timeline`, ``, mermaidBlock(ganttRaw));
    }
    return { id: this.id, title: this.title, content: lines.join("\n") };
  }
};

// src/core/workflow.ts
var SECTIONS = [
  new ProsConsSection(),
  new CostROISection(),
  new RiskRegisterSection(),
  new ADRSection(),
  new RoadmapSection(),
  new DiagramsSection()
];
async function runWorkflow(context, provider, onProgress) {
  const total = 1 + SECTIONS.length;
  onProgress("Identifying architecture candidates", total, 1);
  const raw = await provider.call(buildCandidatesPrompt(context.input), {
    system: "You are an expert AI architect. Return only valid JSON arrays.",
    maxTokens: 2e3
  });
  const candidates = extractJSON(raw);
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new Error("LLM returned no candidates. Check API key and model.");
  }
  context.candidates = candidates;
  for (let i = 0; i < SECTIONS.length; i++) {
    const section = SECTIONS[i];
    onProgress(section.title, total, 2 + i);
    context.sections.set(section.id, await section.generate(context, provider));
  }
}

// src/core/report-compiler.ts
function compileReport(context) {
  return {
    title: `Architecture Analysis: ${context.input.title}`,
    problem: context.input,
    candidates: context.candidates,
    sections: Array.from(context.sections.values()),
    generatedAt: /* @__PURE__ */ new Date()
  };
}

// src/renderers/markdown.ts
import fs2 from "fs";
import path from "path";
var MarkdownRenderer = class {
  format = "markdown";
  async render(report, outDir) {
    fs2.mkdirSync(outDir, { recursive: true });
    const lines = [
      `# ${report.title}`,
      ``,
      `> Generated by adrcli on ${report.generatedAt.toISOString()}`,
      ``,
      `---`,
      ``,
      `## Problem Statement`,
      ``,
      `**${report.problem.title}**`,
      ``,
      report.problem.description,
      ``
    ];
    if (report.problem.constraints && Object.keys(report.problem.constraints).length > 0) {
      lines.push(`### Constraints`, ``);
      for (const [k, v] of Object.entries(report.problem.constraints)) lines.push(`- **${k}:** ${v}`);
      lines.push(``);
    }
    if (report.problem.existingStack?.length) {
      lines.push(`### Existing Stack`, ``);
      lines.push(...report.problem.existingStack.map((s) => `- ${s}`), ``);
    }
    if (report.problem.successMetrics?.length) {
      lines.push(`### Success Metrics`, ``);
      lines.push(...report.problem.successMetrics.map((m) => `- ${m}`), ``);
    }
    lines.push(`---`, ``, `## Architecture Candidates`, ``);
    report.candidates.forEach((c, i) => {
      lines.push(
        `### ${i + 1}. ${c.name}`,
        ``,
        c.description,
        ``,
        `**Key Components:** ${c.keyComponents.join(", ")}`,
        ``,
        `**Best For:** ${c.bestFor}`,
        ``
      );
    });
    for (const section of report.sections) {
      lines.push(`---`, ``, `## ${section.title}`, ``, section.content, ``);
    }
    const slug = report.problem.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const outPath = path.join(outDir, `${slug}-analysis.md`);
    fs2.writeFileSync(outPath, lines.join("\n"));
    return outPath;
  }
};

// src/renderers/html.ts
import fs3 from "fs";
import path2 from "path";
import { marked } from "marked";
var CSS = `
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
`;
var HtmlRenderer = class {
  format = "html";
  async render(report, outDir) {
    fs3.mkdirSync(outDir, { recursive: true });
    const mdRenderer = new MarkdownRenderer();
    const mdPath = await mdRenderer.render(report, outDir);
    const mdContent = fs3.readFileSync(mdPath, "utf-8");
    const htmlBody = await marked(mdContent);
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
</html>`;
    const slug = report.problem.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const outPath = path2.join(outDir, `${slug}-analysis.html`);
    fs3.writeFileSync(outPath, html);
    return outPath;
  }
};

// src/renderers/pdf.ts
import path3 from "path";
var PdfRenderer = class {
  format = "pdf";
  async render(report, outDir) {
    let puppeteer;
    try {
      puppeteer = await import("puppeteer");
    } catch {
      throw new Error(
        "PDF output requires puppeteer (not installed).\nInstall with:  npm install puppeteer\nNote: downloads Chromium (~170MB) on first install."
      );
    }
    const launch = puppeteer.default?.launch ?? puppeteer.launch;
    if (typeof launch !== "function") {
      throw new Error("Could not resolve puppeteer.launch \u2014 check puppeteer version.");
    }
    const htmlRenderer = new HtmlRenderer();
    const htmlPath = await htmlRenderer.render(report, outDir);
    const browser = await launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.goto(`file://${path3.resolve(htmlPath)}`, {
        waitUntil: "networkidle0",
        timeout: 3e4
      });
      await new Promise((r) => setTimeout(r, 3e3));
      const slug = report.problem.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const pdfPath = path3.join(outDir, `${slug}-analysis.pdf`);
      await page.pdf({
        path: pdfPath,
        format: "A4",
        printBackground: true,
        margin: { top: "2cm", right: "2cm", bottom: "2cm", left: "2cm" }
      });
      return pdfPath;
    } finally {
      await browser.close();
    }
  }
};

// src/providers/claude.ts
import Anthropic from "@anthropic-ai/sdk";
var SYSTEM_DEFAULT = "You are an expert AI architect and systems designer with deep knowledge of cloud infrastructure, ML systems, distributed systems, and enterprise software. Provide precise, opinionated analysis backed by engineering tradeoffs.";
var ClaudeProvider = class {
  id = "claude";
  client;
  model;
  constructor(apiKey, model = "claude-sonnet-4-6") {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }
  async call(prompt, opts = {}) {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: opts.maxTokens ?? 4096,
      system: opts.system ?? SYSTEM_DEFAULT,
      messages: [{ role: "user", content: prompt }]
    });
    const block = response.content[0];
    if (!block || block.type !== "text") {
      throw new Error("Unexpected response structure from Claude API");
    }
    return block.text;
  }
};

// src/providers/openai.ts
var OpenAIProvider = class {
  id = "openai";
  constructor(_apiKey, _model = "gpt-4o") {
  }
  async call(_prompt, _opts = {}) {
    throw new Error(
      "OpenAI provider not yet implemented. Use: adrcli config set provider claude"
    );
  }
};

// src/providers/ollama.ts
var OllamaProvider = class {
  id = "ollama";
  baseUrl;
  model;
  constructor(baseUrl = "http://localhost:11434", model = "llama3") {
    this.baseUrl = baseUrl;
    this.model = model;
  }
  async call(prompt, opts = {}) {
    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        prompt: opts.system ? `${opts.system}

${prompt}` : prompt,
        stream: false,
        options: { num_predict: opts.maxTokens ?? 4096, temperature: opts.temperature ?? 0.7 }
      })
    });
    if (!res.ok) throw new Error(`Ollama error: ${res.status} ${res.statusText}`);
    const data = await res.json();
    return data.response;
  }
};

// src/config/store.ts
import fs4 from "fs";
import os from "os";
import path4 from "path";
var CONFIG_DIR = path4.join(os.homedir(), ".adrcli");
var CONFIG_FILE = path4.join(CONFIG_DIR, "config.json");
var DEFAULTS = {
  provider: "claude",
  model: "claude-sonnet-4-6"
};
function loadConfig() {
  try {
    const raw = fs4.readFileSync(CONFIG_FILE, "utf-8");
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}
function saveConfig(updates) {
  const existing = loadConfig();
  const merged = { ...existing, ...updates };
  fs4.mkdirSync(CONFIG_DIR, { recursive: true });
  fs4.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2));
}
function getApiKey(provider) {
  const config = loadConfig();
  const envMap = {
    claude: process.env["ANTHROPIC_API_KEY"],
    openai: process.env["OPENAI_API_KEY"],
    ollama: "not-required"
  };
  const key = envMap[provider] ?? config.apiKey;
  if (!key) {
    throw new Error(
      `No API key found for provider "${provider}".
Set env var or run: adrcli config set apiKey <key>`
    );
  }
  return key;
}

// src/providers/registry.ts
function createProvider() {
  const config = loadConfig();
  const { provider, model, ollamaUrl } = config;
  switch (provider) {
    case "claude":
      return new ClaudeProvider(getApiKey("claude"), model);
    case "openai":
      return new OpenAIProvider(getApiKey("openai"), model);
    case "ollama":
      return new OllamaProvider(ollamaUrl, model);
    default:
      throw new Error(
        `Unknown provider: "${config.provider}". Run: adrcli config set provider <claude|openai|ollama>`
      );
  }
}

// src/cli/analyze.ts
async function analyzeCommand(promptArg, options) {
  const spinner = ora({ color: "cyan" });
  const fmt = options.format ?? "markdown";
  try {
    spinner.start("Parsing problem input...");
    const problemInput = await parseInput({
      prompt: promptArg,
      file: options.file,
      interactive: options.interactive
    });
    spinner.succeed(`Problem: ${chalk.bold(problemInput.title)}`);
    const provider = createProvider();
    console.log(chalk.dim(`  Provider: ${provider.id}`));
    const context = {
      input: problemInput,
      candidates: [],
      sections: /* @__PURE__ */ new Map(),
      sectionData: /* @__PURE__ */ new Map()
    };
    await runWorkflow(context, provider, (step, total, current) => {
      spinner.start(`[${current}/${total}] ${step}...`);
    });
    spinner.succeed("Analysis complete");
    if (context.recommended) {
      console.log(chalk.cyan(`  \u2192 Recommended: ${chalk.bold(context.recommended)}`));
    }
    const report = compileReport(context);
    const outDir = options.out ?? path5.join(process.cwd(), "reports");
    const outputs = [];
    if (fmt === "markdown" || fmt === "all") {
      outputs.push(await new MarkdownRenderer().render(report, outDir));
    }
    if (fmt === "html" || fmt === "all") {
      outputs.push(await new HtmlRenderer().render(report, outDir));
    }
    if (fmt === "pdf" || fmt === "all") {
      outputs.push(await new PdfRenderer().render(report, outDir));
    }
    console.log(`
${chalk.green("\u2713")} Reports generated:`);
    outputs.forEach((p) => console.log(`  ${chalk.underline(p)}`));
    console.log(
      chalk.dim(`
  Sections: ${report.sections.length}  |  Candidates: ${report.candidates.length}`)
    );
  } catch (err) {
    spinner.fail("Analysis failed");
    console.error(chalk.red(`
Error: ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }
}

// src/cli/config.ts
import chalk2 from "chalk";
var VALID_KEYS = ["provider", "model", "apiKey", "ollamaUrl", "outputDir"];
function registerConfigCommand(program2) {
  const cfg = program2.command("config").description("Manage adrcli configuration");
  cfg.command("set <key> <value>").description("Set a config value").action((key, value) => {
    if (!VALID_KEYS.includes(key)) {
      console.error(chalk2.red(`Unknown key: ${key}`));
      console.error(`Valid keys: ${VALID_KEYS.join(", ")}`);
      process.exit(1);
    }
    saveConfig({ [key]: value });
    console.log(chalk2.green(`\u2713 ${key} = ${key === "apiKey" ? "***" : value}`));
  });
  cfg.command("get").description("Show current configuration").action(() => {
    const c = loadConfig();
    console.log(JSON.stringify({ ...c, apiKey: c.apiKey ? "***" : void 0 }, null, 2));
  });
}

// src/cli/index.ts
var program = new Command();
program.name("adrcli").description("AI-powered Architecture Decision Record CLI for AI Architects").version("0.1.0");
program.command("analyze [prompt]").description("Analyze a business problem and generate an architecture report").option("-f, --file <path>", "Path to YAML/JSON problem input file").option("-i, --interactive", "Guided interactive input mode").option("-o, --out <dir>", "Output directory for reports", "./reports").option("--format <fmt>", "Output format: markdown|html|pdf|all", "markdown").action(async (prompt, opts) => {
  await analyzeCommand(prompt, opts ?? {});
});
registerConfigCommand(program);
program.addHelpText("after", `
Examples:
  $ adrcli analyze "Build a customer churn prediction system"
  $ adrcli analyze --file templates/problem.yaml
  $ adrcli analyze --interactive
  $ adrcli config set provider claude
  $ adrcli config set apiKey sk-ant-...
`);
program.parse();
