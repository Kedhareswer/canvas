import { RunnableConfig } from "@langchain/core/runnables";
import { LaTeXGraphState } from "../state";
import { createLLM } from "@/lib/llm";
import { AgentModelConfig } from "@/store/settingsStore";
import { getModelResponseText } from "./response-utils";

export const AGGREGATOR_PROMPT = `You are a helpful assistant. Summarize what the AI agents did to the user's LaTeX document in 2-3 sentences. Be concise and friendly. If there are reviewer suggestions, briefly mention the most important ones.

On the VERY LAST LINE of your response (after your summary), output exactly this JSON (no newline after it):
{"continueReasoning": false}

Set continueReasoning to true ONLY if ANY of these conditions are true:
- Research found citations but the writer has not yet incorporated \\cite{} commands into the narrative
- Reviewer found issues but the writer has not yet applied the fixes
- New sections were created that reference missing content

Otherwise always set continueReasoning: false.`;

export async function aggregatorNode(
  state: LaTeXGraphState,
  config?: RunnableConfig
): Promise<Partial<LaTeXGraphState>> {
  const outputs = state.agentOutputs;

  const cfg = config?.configurable ?? {};
  const customPrompts = (cfg.customPrompts ?? {}) as Record<string, string>;
  const modelConfigs = (cfg.modelConfigs ?? {}) as Partial<Record<string, AgentModelConfig>>;
  const apiKey = cfg.googleApiKey as string | undefined;
  const groqApiKey = cfg.groqApiKey as string | undefined;

  const agentCfg = modelConfigs["aggregator"];

  // Determine final LaTeX: prefer writer > formatter > existing
  let finalLatex = state.latexDocument;

  if (outputs.writer?.updatedLatex) {
    finalLatex = outputs.writer.updatedLatex;
  }

  if (outputs.formatter?.updatedLatex && !outputs.writer?.updatedLatex) {
    finalLatex = outputs.formatter.updatedLatex;
  }

  // Append bibliography from research if not already present
  if (outputs.research?.updatedLatex && outputs.research.citations?.length) {
    const hasBib = finalLatex.includes("\\begin{thebibliography}");
    if (!hasBib && outputs.research.updatedLatex.includes("\\begin{thebibliography}")) {
      const endDocIdx = finalLatex.lastIndexOf("\\end{document}");
      if (endDocIdx !== -1) {
        const bibSection = outputs.research.updatedLatex.match(
          /\\begin\{thebibliography\}[\s\S]*?\\end\{thebibliography\}/
        );
        if (bibSection) {
          finalLatex =
            finalLatex.slice(0, endDocIdx) +
            "\n" +
            bibSection[0] +
            "\n\n" +
            finalLatex.slice(endDocIdx);
        }
      }
    }
  }

  const agentNames = Object.keys(outputs);
  let followupMessage = "";
  let continueReasoning = false;

  try {
    const llm = createLLM({
      provider: agentCfg?.provider ?? "gemini",
      temperature: agentCfg?.temperature ?? 0.5,
      model: agentCfg?.model,
      apiKey,
      groqApiKey,
    });

    const summaryParts: string[] = [];
    if (outputs.writer) summaryParts.push("Writer agent updated the document content.");
    if (outputs.reviewer?.suggestions?.length)
      summaryParts.push(`Reviewer found ${outputs.reviewer.suggestions.length} suggestions.`);
    if (outputs.formatter) summaryParts.push("Formatter improved the document structure.");
    if (outputs.research?.citations?.length)
      summaryParts.push(`Research agent found ${outputs.research.citations.length} citations.`);

    const systemPrompt = customPrompts["aggregator"] ?? AGGREGATOR_PROMPT;

    const response = await llm.invoke([
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `User instruction: ${state.userInstruction}\nHop: ${state.hopCount}\nAgents that ran: ${agentNames.join(", ")}\nSummary: ${summaryParts.join(" ")}\n${
          outputs.reviewer?.suggestions
            ? "Reviewer suggestions: " +
              JSON.stringify(outputs.reviewer.suggestions.slice(0, 3))
            : ""
        }${
          outputs.research?.citations?.length
            ? `\nCitations found: ${outputs.research.citations.length} (writer has${outputs.writer ? "" : " NOT"} run this hop)`
            : ""
        }`,
      },
    ]);

    const rawText = getModelResponseText(response.content);

    // Extract continueReasoning JSON from last line
    const lines = rawText.trim().split("\n");
    const lastLine = lines[lines.length - 1].trim();
    try {
      const parsed = JSON.parse(lastLine);
      if (typeof parsed.continueReasoning === "boolean") {
        continueReasoning = parsed.continueReasoning;
        followupMessage = lines.slice(0, -1).join("\n").trim();
      } else {
        followupMessage = rawText.trim();
      }
    } catch {
      followupMessage = rawText.trim();
    }
  } catch {
    followupMessage = `Done! ${agentNames.join(", ")} agent(s) processed your request.`;
  }

  return { finalLatex, followupMessage, continueReasoning };
}
