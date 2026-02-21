"use client";

import { useCallback, useRef } from "react";
import { StreamChunk } from "@/types/chat";
import { useDocumentStore } from "@/store/documentStore";
import { useChatStore } from "@/store/chatStore";
import { useUIStore } from "@/store/uiStore";
import { useSettingsStore, PromptAgentName, AgentModelConfig } from "@/store/settingsStore";
import { AgentName } from "@/types/agent";

function toBase64Utf8(value: unknown): string {
  const json = JSON.stringify(value);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export function useAgentStream() {
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (
      userInstruction: string,
      latexDocument: string,
      forcedAgents: AgentName[] = []
    ) => {
      if (abortRef.current) {
        abortRef.current.abort();
      }

      const abortController = new AbortController();
      abortRef.current = abortController;

      const { addUserMessage, addAssistantMessage, addAgentEvent, setIsStreaming } =
        useChatStore.getState();
      const { setSource, pushRevision } = useDocumentStore.getState();
      const { addRunningAgent, removeRunningAgent, clearRunningAgents } =
        useUIStore.getState();
      const {
        googleApiKey,
        exaApiKey,
        groqApiKey,
        customPrompts,
        agentModelConfigs,
        maxHops,
        executionMode,
        quickProvider,
        quickModel,
        landingSkills,
      } = useSettingsStore.getState();
      const effectiveExecutionMode =
        executionMode === "programmatic" ? "programmatic" : "agentic";

      /* ── Apply quickModel as fallback for agents without per-agent config ── */
      const ALL_AGENTS: PromptAgentName[] = ["router", "writer", "reviewer", "formatter", "research", "aggregator"];
      const effectiveConfigs: Partial<Record<PromptAgentName, AgentModelConfig>> = {};
      for (const agent of ALL_AGENTS) {
        effectiveConfigs[agent] = agentModelConfigs[agent] ?? {
          provider: quickProvider,
          model: quickModel,
          temperature: agent === "router" ? 0 : 0.7,
        };
      }

      /* ── Apply landing skills ── */
      const effectiveMaxHops = landingSkills.deepReview ? Math.max(maxHops, 4) : maxHops;

      // Build skill-aware forced agents
      const effectiveForcedAgents = [...forcedAgents];
      if (landingSkills.webResearch && !effectiveForcedAgents.includes("research")) {
        effectiveForcedAgents.push("research");
      }

      // Build skill-aware custom prompts
      const effectivePrompts = { ...customPrompts };
      const skillInstructions: string[] = [];
      if (landingSkills.citationStyle) {
        skillInstructions.push(
          `Use ${landingSkills.citationStyle.toUpperCase()} citation style throughout the document.`
        );
      }
      if (landingSkills.documentClass) {
        skillInstructions.push(
          `Use \\documentclass{${landingSkills.documentClass}} as the LaTeX document class.`
        );
      }
      if (skillInstructions.length > 0) {
        const prefix = skillInstructions.join(" ");
        effectivePrompts.writer = effectivePrompts.writer
          ? `${prefix}\n\n${effectivePrompts.writer}`
          : prefix;
      }

      addUserMessage(userInstruction);
      setIsStreaming(true);
      clearRunningAgents();

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (googleApiKey) headers["X-API-Key"] = googleApiKey;
        if (exaApiKey) headers["X-Exa-Key"] = exaApiKey;
        if (groqApiKey) headers["X-Groq-Key"] = groqApiKey;
        if (Object.keys(effectivePrompts).length > 0) {
          headers["X-Custom-Prompts"] = toBase64Utf8(effectivePrompts);
        }
        if (Object.keys(effectiveConfigs).length > 0) {
          headers["X-Model-Configs"] = toBase64Utf8(effectiveConfigs);
        }

        const response = await fetch("/api/agent", {
          method: "POST",
          headers,
          body: JSON.stringify({
            latexDocument,
            userInstruction,
            forcedAgents: effectiveForcedAgents,
            maxHops: effectiveMaxHops,
            executionMode: effectiveExecutionMode,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6);

            try {
              const chunk: StreamChunk = JSON.parse(jsonStr);

              switch (chunk.type) {
                case "hop-start":
                  addAssistantMessage(
                    `\u{1F504} Hop ${chunk.hopNumber}${chunk.totalHops && chunk.totalHops > 1 ? `/${chunk.totalHops}` : ""}: ${chunk.hopReason ?? ""}`
                  );
                  break;

                case "hop-complete":
                  clearRunningAgents();
                  break;

                case "agent-start":
                  if (chunk.agentName) addRunningAgent(chunk.agentName);
                  break;

                case "latex-update":
                  if (chunk.partialLatex) setSource(chunk.partialLatex);
                  break;

                case "agent-output":
                  if (chunk.agentName) {
                    removeRunningAgent(chunk.agentName);
                    const agentOut = chunk.agentOutputs?.[chunk.agentName];
                    if (agentOut) addAgentEvent(agentOut);
                  }
                  break;

                case "followup":
                  if (chunk.followupContent) addAssistantMessage(chunk.followupContent);
                  break;

                case "done":
                  pushRevision();
                  clearRunningAgents();
                  break;

                case "error":
                  addAssistantMessage(`Error: ${chunk.error ?? "Unknown error"}`);
                  clearRunningAgents();
                  break;
              }
            } catch {
              // skip malformed JSON
            }
          }
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          addAssistantMessage(`Connection error: ${(error as Error).message}`);
        }
      } finally {
        setIsStreaming(false);
        clearRunningAgents();
        abortRef.current = null;
      }
    },
    []
  );

  const abort = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  return { sendMessage, abort };
}
