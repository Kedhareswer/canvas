import { RunnableConfig } from "@langchain/core/runnables";
import { LaTeXGraphState } from "../state";
import { createLLM } from "@/lib/llm";
import { REVIEWER_SYSTEM_PROMPT } from "../prompts/reviewer";
import { AgentOutput } from "@/types/agent";
import { AgentModelConfig } from "@/store/settingsStore";
import { getModelResponseText, parseJsonFromText } from "./response-utils";

function parseReviewerSuggestions(value: unknown): NonNullable<AgentOutput["suggestions"]> {
  const items = Array.isArray(value)
    ? value
    : value && typeof value === "object" && Array.isArray((value as { suggestions?: unknown }).suggestions)
      ? (value as { suggestions: unknown[] }).suggestions
      : [];

  return items
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const rec = item as Record<string, unknown>;
      const severity = rec.severity;
      return {
        location: typeof rec.location === "string" ? rec.location : "General",
        issue: typeof rec.issue === "string" ? rec.issue : "Needs review",
        suggestion: typeof rec.suggestion === "string" ? rec.suggestion : "",
        severity:
          severity === "warning" || severity === "error" || severity === "info"
            ? severity
            : "info",
      };
    })
    .filter((item): item is NonNullable<AgentOutput["suggestions"]>[number] => Boolean(item));
}

export async function reviewerAgent(
  state: LaTeXGraphState,
  config?: RunnableConfig
): Promise<Partial<LaTeXGraphState>> {
  const cfg = config?.configurable ?? {};
  const customPrompts = (cfg.customPrompts ?? {}) as Record<string, string>;
  const modelConfigs = (cfg.modelConfigs ?? {}) as Partial<Record<string, AgentModelConfig>>;
  const apiKey = cfg.googleApiKey as string | undefined;
  const groqApiKey = cfg.groqApiKey as string | undefined;

  const agentCfg = modelConfigs["reviewer"];
  const llm = createLLM({
    provider: agentCfg?.provider ?? "gemini",
    temperature: agentCfg?.temperature ?? 0.3,
    model: agentCfg?.model,
    apiKey,
    groqApiKey,
  });

  const systemPrompt = customPrompts["reviewer"] ?? REVIEWER_SYSTEM_PROMPT;

  const response = await llm.invoke([
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `DOCUMENT TO REVIEW:\n${state.latexDocument}\n\nCONTEXT:\n${state.userInstruction}`,
    },
  ]);

  const text = getModelResponseText(response.content);

  let suggestions: AgentOutput["suggestions"] = [];
  try {
    suggestions = parseReviewerSuggestions(parseJsonFromText(text));
  } catch {
    suggestions = [
      {
        location: "General",
        issue: "Could not parse review",
        suggestion: text.slice(0, 500),
        severity: "info",
      },
    ];
  }

  const output: AgentOutput = {
    agentName: "reviewer",
    suggestions,
    reasoning: "Reviewed the document for grammar, clarity, and structure.",
  };

  return { agentOutputs: { reviewer: output } };
}
