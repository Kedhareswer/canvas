import { NextRequest } from "next/server";
import { graph } from "@/agents/graph";
import { StreamChunk } from "@/types/chat";
import { AgentName, AgentOutput } from "@/types/agent";
import { HumanMessage } from "@langchain/core/messages";
import { processImagePlaceholders } from "@/lib/latex/image-processor";

export const maxDuration = 120;

function parseBase64Header(req: NextRequest, headerName: string): Record<string, unknown> {
  const header = req.headers.get(headerName);
  if (!header) return {};
  try {
    return JSON.parse(Buffer.from(header, "base64").toString("utf-8"));
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    latexDocument,
    userInstruction,
    messages = [],
    forcedAgents = [],
    maxHops = 2,
  } = body;

  const googleApiKey = req.headers.get("X-API-Key") || undefined;
  const exaApiKey = req.headers.get("X-Exa-Key") || undefined;
  const groqApiKey = req.headers.get("X-Groq-Key") || undefined;
  const customPrompts = parseBase64Header(req, "X-Custom-Prompts");
  const modelConfigs = parseBase64Header(req, "X-Model-Configs");

  const encoder = new TextEncoder();
  let controllerRef: ReadableStreamDefaultController | null = null;

  function sendSSE(chunk: StreamChunk) {
    if (!controllerRef) return;
    try {
      controllerRef.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
    } catch {
      // stream closed
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      controllerRef = controller;

      try {
        const effectiveMaxHops = Math.min(5, Math.max(1, maxHops));

        interface HopState {
          messages: HumanMessage[];
          latexDocument: string;
          userInstruction: string;
          forcedAgents: AgentName[];
          agentOutputs: Partial<Record<AgentName, AgentOutput>>;
          followupMessage: string;
          continueReasoning: boolean;
          hopCount: number;
        }

        let currentState: HopState = {
          messages: messages.map((m: { role: string; content: string }) =>
            new HumanMessage(m.content)
          ),
          latexDocument: latexDocument || "",
          userInstruction,
          forcedAgents,
          agentOutputs: {},
          followupMessage: "",
          continueReasoning: false,
          hopCount: 0,
        };

        for (let hop = 1; hop <= effectiveMaxHops; hop++) {
          sendSSE({
            type: "hop-start",
            hopNumber: hop,
            totalHops: effectiveMaxHops,
            hopReason:
              hop === 1
                ? "Starting initial agent pass"
                : `Continuing: ${currentState.followupMessage.slice(0, 100)}`,
          });

          let hopFinalLatex = currentState.latexDocument;
          let hopFollowup = "";
          let hopContinue = false;

          const streamResult = graph.stream(
            {
              ...currentState,
              hopCount: hop,
              agentOutputs: {},
            },
            {
              streamMode: "updates",
              configurable: {
                googleApiKey,
                groqApiKey,
                exaApiKey,
                customPrompts,
                modelConfigs,
              },
            }
          );

          for await (const event of await streamResult) {
            for (const [nodeName, nodeOutput] of Object.entries(event)) {
              const output = nodeOutput as Record<string, unknown>;

              if (nodeName === "router") {
                const activeAgents = (output.activeAgents as AgentName[]) || [];
                for (const agentName of activeAgents) {
                  sendSSE({ type: "agent-start", agentName });
                }
              } else if (nodeName === "writer" || nodeName === "formatter") {
                const agentOutputs = output.agentOutputs as
                  | Record<string, { updatedLatex?: string }>
                  | undefined;
                const agentOutput = agentOutputs?.[nodeName];
                if (agentOutput?.updatedLatex) {
                  sendSSE({
                    type: "latex-update",
                    partialLatex: agentOutput.updatedLatex,
                    agentName: nodeName as AgentName,
                  });
                }
                sendSSE({
                  type: "agent-output",
                  agentName: nodeName as AgentName,
                  agentOutputs: agentOutputs as Record<string, never>,
                });
              } else if (nodeName === "reviewer" || nodeName === "research") {
                sendSSE({
                  type: "agent-output",
                  agentName: nodeName as AgentName,
                  agentOutputs: output.agentOutputs as Record<string, never>,
                });
              } else if (nodeName === "aggregator") {
                if (output.finalLatex) {
                  hopFinalLatex = output.finalLatex as string;
                  sendSSE({ type: "latex-update", partialLatex: hopFinalLatex });
                }
                if (output.followupMessage) {
                  hopFollowup = output.followupMessage as string;
                }
                hopContinue = Boolean(output.continueReasoning);
              }
            }
          }

          sendSSE({
            type: "hop-complete",
            hopNumber: hop,
            totalHops: effectiveMaxHops,
          });

          currentState = {
            ...currentState,
            latexDocument: hopFinalLatex,
            followupMessage: hopFollowup,
            continueReasoning: hopContinue,
            agentOutputs: {},
            forcedAgents: [],
          };

          if (!hopContinue) break;
        }

        // Post-process: generate images for [gen:...] placeholders
        if (currentState.latexDocument.includes("[gen:")) {
          const imageApiKey = googleApiKey || process.env.GOOGLE_API_KEY || "";
          if (imageApiKey) {
            try {
              sendSSE({ type: "followup", followupContent: "Generating images..." });
              const { latex: imageProcessedLatex, generatedImages } =
                await processImagePlaceholders(
                  currentState.latexDocument,
                  imageApiKey,
                  (msg) => sendSSE({ type: "followup", followupContent: msg })
                );

              if (generatedImages.length > 0) {
                currentState.latexDocument = imageProcessedLatex;
                sendSSE({
                  type: "latex-update",
                  partialLatex: imageProcessedLatex,
                });
              }
            } catch (error) {
              console.error("Image generation post-processing failed:", error);
            }
          }
        }

        if (currentState.followupMessage) {
          sendSSE({ type: "followup", followupContent: currentState.followupMessage });
        }

        sendSSE({ type: "done" });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        sendSSE({ type: "error", error: message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
