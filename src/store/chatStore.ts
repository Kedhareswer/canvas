import { create } from "zustand";
import { ChatMessage } from "@/types/chat";
import { AgentOutput } from "@/types/agent";
import { generateId } from "@/lib/utils";

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;

  addUserMessage: (content: string) => void;
  addAssistantMessage: (content: string) => void;
  addAgentEvent: (agentOutput: AgentOutput) => void;
  appendStreamingContent: (content: string) => void;
  setIsStreaming: (streaming: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isStreaming: false,

  addUserMessage: (content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: generateId(),
          role: "user",
          content,
          timestamp: new Date().toISOString(),
        },
      ],
    })),

  addAssistantMessage: (content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: generateId(),
          role: "assistant",
          content,
          timestamp: new Date().toISOString(),
        },
      ],
    })),

  addAgentEvent: (agentOutput) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: generateId(),
          role: "agent-event",
          content: agentOutput.reasoning || `${agentOutput.agentName} completed`,
          agentName: agentOutput.agentName,
          agentOutput,
          timestamp: new Date().toISOString(),
        },
      ],
    })),

  appendStreamingContent: (content) => {
    const { messages } = get();
    const last = messages[messages.length - 1];
    if (last && last.role === "assistant") {
      set({
        messages: [
          ...messages.slice(0, -1),
          { ...last, content: last.content + content },
        ],
      });
    } else {
      set((state) => ({
        messages: [
          ...state.messages,
          {
            id: generateId(),
            role: "assistant",
            content,
            timestamp: new Date().toISOString(),
          },
        ],
      }));
    }
  },

  setIsStreaming: (streaming) => set({ isStreaming: streaming }),

  clearMessages: () => set({ messages: [] }),
}));
