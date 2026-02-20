import { RunnableConfig } from "@langchain/core/runnables";
import { LaTeXGraphState } from "../state";
import { createGemini } from "@/lib/gemini";
import { AgentName } from "@/types/agent";
import { GeminiModel } from "@/store/settingsStore";

export const ROUTER_PROMPT = `You are a router that decides which AI agents should handle a user's request about a LaTeX document.

Available agents:
- "writer": Generates or rewrites LaTeX content (new sections, rewrites, content changes)
- "reviewer": Reviews grammar, clarity, and structure (proofreading, feedback)
- "formatter": Fixes LaTeX formatting without changing content (tables, colors, layout)
- "research": Finds citations and references for topics

Analyze the user's instruction and decide which agents to activate. Usually 1-2 agents.
- Content creation/editing → writer
- "Review", "proofread", "check" → reviewer
- "Format", "fix layout", "make it look better" → formatter
- "Find sources", "add citations", "research" → research
- "Write about X" → writer + research
- Generic requests → writer

If this is a subsequent hop (hop > 1), consider what already ran and what still needs doing:
- If reviewer ran and writer has not yet fixed the issues → writer
- If research ran but writer has not yet incorporated citations → writer
- If work seems complete → set continueReasoning: false

Output ONLY a JSON object: {"activeAgents": ["writer"], "reasoning": "...", "continueReasoning": false}
No markdown, no code fences.`;

export async function routerNode(
  state: LaTeXGraphState,
  config?: RunnableConfig
): Promise<Partial<LaTeXGraphState>> {
  if (state.forcedAgents && state.forcedAgents.length > 0) {
    return { activeAgents: state.forcedAgents };
  }

  const cfg = config?.configurable ?? {};
  const customPrompts = (cfg.customPrompts ?? {}) as Record<string, string>;
  const modelConfigs = (cfg.modelConfigs ?? {}) as Record<string, { model: GeminiModel; temperature: number }>;
  const apiKey = cfg.googleApiKey as string | undefined;

  const agentCfg = modelConfigs["router"];
  const llm = createGemini({
    temperature: agentCfg?.temperature ?? 0,
    model: agentCfg?.model,
    apiKey,
  });

  const systemPrompt = customPrompts["router"] ?? ROUTER_PROMPT;
  const previousAgents = Object.keys(state.agentOutputs);
  const hopContext =
    state.hopCount > 1
      ? `\nPrevious hop agents: ${previousAgents.join(", ")}\nPrevious summary: ${state.followupMessage}`
      : "";

  const response = await llm.invoke([
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Current document length: ${state.latexDocument.length} chars\nHop: ${state.hopCount}\nUser instruction: ${state.userInstruction}${hopContext}`,
    },
  ]);

  try {
    const text =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    const validAgents: AgentName[] = ["writer", "reviewer", "formatter", "research"];
    const activeAgents = (parsed.activeAgents as string[]).filter((a) =>
      validAgents.includes(a as AgentName)
    ) as AgentName[];
    return {
      activeAgents: activeAgents.length > 0 ? activeAgents : ["writer"],
      continueReasoning: Boolean(parsed.continueReasoning),
    };
  } catch {
    return { activeAgents: ["writer"], continueReasoning: false };
  }
}
