import { createContext, Script } from "node:vm";
import { createLLM } from "@/lib/llm";

type Provider = "gemini" | "groq";

interface RuntimeModelConfig {
  provider?: Provider;
  model?: string;
  temperature?: number;
}

interface ExaResult {
  title: string;
  url: string;
  snippet: string;
}

interface PlanPayload {
  javascript: string;
  summary?: string;
}

interface ToolExecutionResult {
  queries?: string[];
  findings?: string[];
  citations?: ExaResult[];
  notes?: string;
}

interface ProgrammaticInput {
  latexDocument: string;
  userInstruction: string;
  googleApiKey?: string;
  groqApiKey?: string;
  exaApiKey?: string;
  customPrompts?: Record<string, string>;
  modelConfigs?: Record<string, RuntimeModelConfig>;
}

interface ProgrammaticOutput {
  finalLatex: string;
  followupMessage: string;
}

const PROGRAMMATIC_PLANNER_PROMPT = `You are a tool-orchestration planner.
Return ONLY valid JSON:
{
  "javascript": "async JavaScript function body that returns an object",
  "summary": "one sentence plan summary"
}

The code runs in a sandbox with:
- input.userInstruction (string)
- input.latexDocument (string)
- tools.searchWeb(query): Promise<Array<{ title, url, snippet }>>

Rules:
1) Always return an object from the code body with keys:
   - queries: string[]
   - citations: Array<{ title: string; url: string; snippet: string }>
   - findings: string[]
   - notes: string
2) Use Promise.all when running multiple searchWeb calls.
3) Keep result concise and deduplicated.
4) No markdown, no code fences.`;

const PROGRAMMATIC_FINAL_PROMPT = `You are a LaTeX writer.
Given current LaTeX, user instruction, and tool output, produce the COMPLETE updated .tex document.

Rules:
1) Output only raw LaTeX (no markdown/code fences).
2) Preserve valid preamble and \\begin{document} ... \\end{document}.
3) Integrate citations naturally and keep references section coherent.
4) Do not invent URLs; use only provided tool output when citing web sources.`;

function parseJsonObject(text: string): Record<string, unknown> {
  const cleaned = text.trim().replace(/```json\n?/gi, "").replace(/```\n?/g, "");
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
    }
    throw new Error("Planner returned invalid JSON.");
  }
}

function coerceProvider(value: unknown): Provider {
  return value === "groq" ? "groq" : "gemini";
}

function resolveProvider(
  requested: Provider,
  googleApiKey?: string,
  groqApiKey?: string
): Provider {
  const hasGoogle = Boolean(googleApiKey || process.env.GOOGLE_API_KEY);
  const hasGroq = Boolean(groqApiKey || process.env.GROQ_API_KEY);

  if (requested === "groq" && !hasGroq && hasGoogle) return "gemini";
  if (requested === "gemini" && !hasGoogle && hasGroq) return "groq";
  return requested;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function normalizeCitations(value: unknown): ExaResult[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const rec = item as Record<string, unknown>;
      return {
        title: typeof rec.title === "string" ? rec.title : "Untitled",
        url: typeof rec.url === "string" ? rec.url : "",
        snippet: typeof rec.snippet === "string" ? rec.snippet : "",
      };
    })
    .filter((v): v is ExaResult => Boolean(v))
    .filter((v) => v.url.length > 0);
}

async function searchWeb(query: string, exaApiKey?: string): Promise<ExaResult[]> {
  if (!exaApiKey || !query.trim()) return [];
  const res = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": exaApiKey,
    },
    body: JSON.stringify({
      query,
      numResults: 5,
      type: "neural",
    }),
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { results?: Array<Record<string, unknown>> };
  const results = Array.isArray(json.results) ? json.results : [];
  return results.map((r) => ({
    title: typeof r.title === "string" ? r.title : "Untitled",
    url: typeof r.url === "string" ? r.url : "",
    snippet:
      typeof r.text === "string"
        ? r.text.slice(0, 220)
        : typeof r.snippet === "string"
          ? r.snippet
          : "",
  })).filter((r) => r.url.length > 0);
}

async function executePlanJavascript(
  javascript: string,
  input: { userInstruction: string; latexDocument: string },
  exaApiKey?: string
): Promise<ToolExecutionResult> {
  const tools = {
    searchWeb: async (query: string) => searchWeb(query, exaApiKey),
  };

  const script = new Script(`(async () => { ${javascript}\n})()`);
  const context = createContext({
    input,
    tools,
    Promise,
    Array,
    Object,
    JSON,
    Math,
    String,
    Number,
    Boolean,
  });

  const execution = script.runInContext(context, { timeout: 800 });
  const result = await Promise.race([
    Promise.resolve(execution),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Programmatic plan timed out.")), 10_000)
    ),
  ]);

  const parsed = (result && typeof result === "object"
    ? (result as Record<string, unknown>)
    : {}) as Record<string, unknown>;

  return {
    queries: toStringArray(parsed.queries),
    findings: toStringArray(parsed.findings),
    citations: normalizeCitations(parsed.citations),
    notes: typeof parsed.notes === "string" ? parsed.notes : "",
  };
}

function stripLatexFences(text: string): string {
  return text
    .replace(/^```(?:latex|tex)?\n?/gim, "")
    .replace(/\n?```$/gim, "")
    .trim();
}

export async function runProgrammaticOrchestration(
  input: ProgrammaticInput,
  onProgress?: (message: string) => void
): Promise<ProgrammaticOutput> {
  const modelConfigs = input.modelConfigs ?? {};
  const plannerCfg = modelConfigs.router ?? {};
  const writerCfg = modelConfigs.writer ?? {};

  const plannerLLM = createLLM({
    provider: resolveProvider(
      coerceProvider(plannerCfg.provider),
      input.googleApiKey,
      input.groqApiKey
    ),
    model: plannerCfg.model ?? "gemini-2.5-flash",
    temperature: typeof plannerCfg.temperature === "number" ? plannerCfg.temperature : 0,
    apiKey: input.googleApiKey,
    groqApiKey: input.groqApiKey,
  });

  onProgress?.("Programmatic mode: generating orchestration plan...");
  const plannerResponse = await plannerLLM.invoke([
    { role: "system", content: PROGRAMMATIC_PLANNER_PROMPT },
    {
      role: "user",
      content: `User instruction:\n${input.userInstruction}\n\nDocument preview (first 3000 chars):\n${input.latexDocument.slice(0, 3000)}`,
    },
  ]);

  const plannerText =
    typeof plannerResponse.content === "string"
      ? plannerResponse.content
      : JSON.stringify(plannerResponse.content);
  let plan: PlanPayload = {
    javascript: `
      const queries = [input.userInstruction].filter(Boolean);
      const all = await Promise.all(queries.map((q) => tools.searchWeb(q)));
      const citations = all.flat().slice(0, 8);
      return { queries, citations, findings: citations.map((c) => c.title), notes: "Fallback plan used." };
    `,
    summary: "Fallback orchestration plan.",
  };
  try {
    const parsedPlan = parseJsonObject(plannerText);
    plan = {
      javascript:
        typeof parsedPlan.javascript === "string"
          ? parsedPlan.javascript
          : plan.javascript,
      summary:
        typeof parsedPlan.summary === "string" ? parsedPlan.summary : plan.summary,
    };
  } catch {
    onProgress?.("Planner output was malformed. Using fallback orchestration plan.");
  }

  onProgress?.("Programmatic mode: executing tools in sandbox...");
  let toolResult: ToolExecutionResult = { queries: [], citations: [], findings: [], notes: "" };
  try {
    toolResult = await executePlanJavascript(
      plan.javascript,
      { userInstruction: input.userInstruction, latexDocument: input.latexDocument },
      input.exaApiKey
    );
  } catch {
    onProgress?.("Sandbox execution failed. Continuing with direct synthesis.");
  }

  const writerSystemPrompt =
    input.customPrompts?.writer || PROGRAMMATIC_FINAL_PROMPT;
  const writerLLM = createLLM({
    provider: resolveProvider(
      coerceProvider(writerCfg.provider),
      input.googleApiKey,
      input.groqApiKey
    ),
    model: writerCfg.model ?? "gemini-2.5-flash",
    temperature: typeof writerCfg.temperature === "number" ? writerCfg.temperature : 0.7,
    apiKey: input.googleApiKey,
    groqApiKey: input.groqApiKey,
  });

  onProgress?.("Programmatic mode: synthesizing final LaTeX...");
  const writerResponse = await writerLLM.invoke([
    { role: "system", content: writerSystemPrompt },
    {
      role: "user",
      content: `CURRENT DOCUMENT:\n${input.latexDocument}\n\nINSTRUCTION:\n${input.userInstruction}\n\nTOOL EXECUTION RESULT (JSON):\n${JSON.stringify(toolResult, null, 2)}\n\nReturn the full updated LaTeX document.`,
    },
  ]);

  const rawLatex =
    typeof writerResponse.content === "string"
      ? writerResponse.content
      : JSON.stringify(writerResponse.content);
  const finalLatex = stripLatexFences(rawLatex);

  const queryCount = toolResult.queries?.length ?? 0;
  const citationCount = toolResult.citations?.length ?? 0;
  const followupMessage =
    `Programmatic orchestration complete. Executed ${queryCount} search quer${queryCount === 1 ? "y" : "ies"} and collected ${citationCount} source${citationCount === 1 ? "" : "s"}.` +
    (plan.summary ? ` ${plan.summary}` : "");

  return { finalLatex, followupMessage };
}
