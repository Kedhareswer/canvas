"use client";

import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { AgentStatusBanner } from "./AgentStatusBanner";
import { AgentSelector } from "./AgentSelector";
import { useAgentStream } from "@/hooks/useAgentStream";
import { useDocumentStore } from "@/store/documentStore";
import { useUIStore } from "@/store/uiStore";
import { useChatStore } from "@/store/chatStore";

export function ChatPanel() {
  const { sendMessage, abort } = useAgentStream();
  const source = useDocumentStore((s) => s.source);
  const forcedAgents = useUIStore((s) => s.forcedAgents);
  const isStreaming = useChatStore((s) => s.isStreaming);

  const handleSend = (message: string) => {
    sendMessage(message, source, forcedAgents.length > 0 ? forcedAgents : []);
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border-r border-border bg-background">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="text-sm font-semibold">AI Chat</h3>
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
