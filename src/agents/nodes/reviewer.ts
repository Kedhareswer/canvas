import { RunnableConfig } from "@langchain/core/runnables";
import { LaTeXGraphState } from "../state";
import { createLLM } from "@/lib/llm";
import { REVIEWER_SYSTEM_PROMPT } from "../prompts/reviewer";
import { AgentOutput } from "@/types/agent";
import { AgentModelConfig } from "@/store/settingsStore";

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

  const text =
    typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);

  let suggestions: AgentOutput["suggestions"] = [];
  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    suggestions = JSON.parse(cleaned);
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
