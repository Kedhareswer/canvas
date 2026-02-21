import { RunnableConfig } from "@langchain/core/runnables";
import { LaTeXGraphState } from "../state";
import { createLLM } from "@/lib/llm";
import { WRITER_SYSTEM_PROMPT } from "../prompts/writer";
import { AgentOutput } from "@/types/agent";
import { AgentModelConfig } from "@/store/settingsStore";

export async function writerAgent(
  state: LaTeXGraphState,
  config?: RunnableConfig
): Promise<Partial<LaTeXGraphState>> {
  const cfg = config?.configurable ?? {};
  const customPrompts = (cfg.customPrompts ?? {}) as Record<string, string>;
  const modelConfigs = (cfg.modelConfigs ?? {}) as Partial<Record<string, AgentModelConfig>>;
  const apiKey = cfg.googleApiKey as string | undefined;
  const groqApiKey = cfg.groqApiKey as string | undefined;

  const agentCfg = modelConfigs["writer"];
  const llm = createLLM({
    provider: agentCfg?.provider ?? "gemini",
    temperature: agentCfg?.temperature ?? 0.7,
    model: agentCfg?.model,
    apiKey,
    groqApiKey,
  });

  const systemPrompt = customPrompts["writer"] ?? WRITER_SYSTEM_PROMPT;

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
    agentName: "writer",
    updatedLatex: latex,
    reasoning: "Generated/updated LaTeX content based on user instruction.",
  };

  return { agentOutputs: { writer: output } };
}
