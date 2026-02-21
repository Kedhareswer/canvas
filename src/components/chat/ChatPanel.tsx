"use client";

import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { AgentStatusBanner } from "./AgentStatusBanner";
import { AgentSelector } from "./AgentSelector";
import { useAgentStream } from "@/hooks/useAgentStream";
import { useDocumentStore } from "@/store/documentStore";
import { useUIStore } from "@/store/uiStore";
import { useChatStore } from "@/store/chatStore";
import { useSettingsStore, ExecutionMode } from "@/store/settingsStore";

export function ChatPanel() {
  const { sendMessage, abort } = useAgentStream();
  const source = useDocumentStore((s) => s.source);
  const forcedAgents = useUIStore((s) => s.forcedAgents);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const executionMode = useSettingsStore((s) => s.executionMode);
  const setExecutionMode = useSettingsStore((s) => s.setExecutionMode);

  const handleSend = (message: string) => {
    sendMessage(message, source, forcedAgents.length > 0 ? forcedAgents : []);
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border-r border-border bg-background">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div
            className="inline-flex items-center rounded-md border border-input bg-muted/30 p-0.5"
            role="tablist"
            aria-label="Execution mode"
          >
            {(
              [
                { id: "agentic", label: "Agentic" },
                { id: "programmatic", label: "Programmatic" },
              ] as { id: ExecutionMode; label: string }[]
            ).map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setExecutionMode(mode.id)}
                className={`rounded px-2 py-1 text-[11px] font-medium transition ${executionMode === mode.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
                role="tab"
                aria-selected={executionMode === mode.id}
                title={`Switch to ${mode.label} mode`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
        <AgentSelector />
      </div>

      <AgentStatusBanner />

      <div className="flex-1 overflow-hidden">
        <MessageList />
      </div>

      <ChatInput onSend={handleSend} onAbort={abort} isStreaming={isStreaming} />
    </div>
  );
}
