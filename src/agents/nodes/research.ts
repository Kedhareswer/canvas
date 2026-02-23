import { RunnableConfig } from "@langchain/core/runnables";
import { LaTeXGraphState } from "../state";
import { createLLM } from "@/lib/llm";
import { RESEARCH_SYSTEM_PROMPT } from "../prompts/research";
import { AgentOutput, CitationResult } from "@/types/agent";
import { AgentModelConfig } from "@/store/settingsStore";
import { getModelResponseText, parseJsonFromText } from "./response-utils";

export async function researchAgent(
  state: LaTeXGraphState,
  config?: RunnableConfig
): Promise<Partial<LaTeXGraphState>> {
  const cfg = config?.configurable ?? {};
  const customPrompts = (cfg.customPrompts ?? {}) as Record<string, string>;
  const modelConfigs = (cfg.modelConfigs ?? {}) as Partial<Record<string, AgentModelConfig>>;
  const apiKey = cfg.googleApiKey as string | undefined;
  const groqApiKey = cfg.groqApiKey as string | undefined;

  const agentCfg = modelConfigs["research"];
  const llm = createLLM({
    provider: agentCfg?.provider ?? "gemini",
    temperature: agentCfg?.temperature ?? 0.5,
    model: agentCfg?.model,
    apiKey,
    groqApiKey,
  });

  const systemPrompt = customPrompts["research"] ?? RESEARCH_SYSTEM_PROMPT;

  const response = await llm.invoke([
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `DOCUMENT TOPIC/CONTEXT:\n${state.latexDocument.slice(0, 2000)}\n\nRESEARCH REQUEST:\n${state.userInstruction}`,
    },
  ]);

  const text = getModelResponseText(response.content);

  let citations: CitationResult[] = [];
  let suggestedLatexInsert = "";

  try {
    const parsed = parseJsonFromText(text) as Record<string, unknown>;
    citations = Array.isArray(parsed.citations)
      ? (parsed.citations as CitationResult[])
      : [];
    suggestedLatexInsert =
      typeof parsed.suggestedLatexInsert === "string"
        ? parsed.suggestedLatexInsert
        : "";
  } catch {
    citations = [];
    suggestedLatexInsert = "";
  }

  const output: AgentOutput = {
    agentName: "research",
    citations,
    updatedLatex: suggestedLatexInsert,
    reasoning: `Found ${citations.length} relevant citations.`,
  };

  return { agentOutputs: { research: output } };
}
