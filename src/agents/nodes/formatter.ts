import { RunnableConfig } from "@langchain/core/runnables";
import { LaTeXGraphState } from "../state";
import { createGemini } from "@/lib/gemini";
import { FORMATTER_SYSTEM_PROMPT } from "../prompts/formatter";
import { AgentOutput } from "@/types/agent";
import { GeminiModel } from "@/store/settingsStore";

export async function formatterAgent(
  state: LaTeXGraphState,
  config?: RunnableConfig
): Promise<Partial<LaTeXGraphState>> {
  const cfg = config?.configurable ?? {};
  const customPrompts = (cfg.customPrompts ?? {}) as Record<string, string>;
  const modelConfigs = (cfg.modelConfigs ?? {}) as Record<string, { model: GeminiModel; temperature: number }>;
  const apiKey = cfg.googleApiKey as string | undefined;

  const agentCfg = modelConfigs["formatter"];
  const llm = createGemini({
    temperature: agentCfg?.temperature ?? 0.3,
    model: agentCfg?.model,
    apiKey,
  });

  const systemPrompt = customPrompts["formatter"] ?? FORMATTER_SYSTEM_PROMPT;

  const response = await llm.invoke([
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `CURRENT DOCUMENT:\n${state.latexDocument}\n\nINSTRUCTION:\n${state.userInstruction}`,
    },
  ]);

  const text =
    typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);

  const latex = text
    .replace(/^```(?:latex|tex)?\n?/gm, "")
    .replace(/\n?```$/gm, "")
    .trim();

  const output: AgentOutput = {
    agentName: "formatter",
    updatedLatex: latex,
    reasoning: "Reformatted the document structure and styling.",
  };

  return { agentOutputs: { formatter: output } };
}
