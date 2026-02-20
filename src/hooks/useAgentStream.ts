"use client";

import { useCallback, useRef } from "react";
import { StreamChunk } from "@/types/chat";
import { useDocumentStore } from "@/store/documentStore";
import { useChatStore } from "@/store/chatStore";
import { useUIStore } from "@/store/uiStore";
import { useSettingsStore } from "@/store/settingsStore";
import { AgentName } from "@/types/agent";

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
        customPrompts,
        agentModelConfigs,
        maxHops,
      } = useSettingsStore.getState();

      addUserMessage(userInstruction);
      setIsStreaming(true);
      clearRunningAgents();

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (googleApiKey) headers["X-API-Key"] = googleApiKey;
        if (exaApiKey) headers["X-Exa-Key"] = exaApiKey;
        if (Object.keys(customPrompts).length > 0) {
          headers["X-Custom-Prompts"] = btoa(JSON.stringify(customPrompts));
        }
        if (Object.keys(agentModelConfigs).length > 0) {
          headers["X-Model-Configs"] = btoa(JSON.stringify(agentModelConfigs));
        }

        const response = await fetch("/api/agent", {
          method: "POST",
          headers,
          body: JSON.stringify({
            latexDocument,
            userInstruction,
            forcedAgents,
            maxHops,
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
