import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ChatMessage } from "@/types/chat";
import { AgentOutput } from "@/types/agent";
import { generateId } from "@/lib/utils";

interface ChatState {
  activeDocId: string | null;
  messagesByDoc: Record<string, ChatMessage[]>;
  messages: ChatMessage[];
  isStreaming: boolean;

  setActiveDoc: (docId: string) => void;
  addUserMessage: (content: string) => void;
  addAssistantMessage: (content: string) => void;
  addAgentEvent: (agentOutput: AgentOutput) => void;
  appendStreamingContent: (content: string) => void;
  setIsStreaming: (streaming: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      activeDocId: null,
      messagesByDoc: {},
      messages: [],
      isStreaming: false,

      setActiveDoc: (docId) =>
        set((state) => ({
          activeDocId: docId,
          messages: state.messagesByDoc[docId] ?? [],
          isStreaming: false,
        })),

      addUserMessage: (content) =>
        set((state) => {
          const nextMessages = [
            ...state.messages,
            {
              id: generateId(),
              role: "user" as const,
              content,
              timestamp: new Date().toISOString(),
            },
          ];
          if (!state.activeDocId) return { messages: nextMessages };
          return {
            messages: nextMessages,
            messagesByDoc: { ...state.messagesByDoc, [state.activeDocId]: nextMessages },
          };
        }),

      addAssistantMessage: (content) =>
        set((state) => {
          const nextMessages = [
            ...state.messages,
            {
              id: generateId(),
              role: "assistant" as const,
              content,
              timestamp: new Date().toISOString(),
            },
          ];
          if (!state.activeDocId) return { messages: nextMessages };
          return {
            messages: nextMessages,
            messagesByDoc: { ...state.messagesByDoc, [state.activeDocId]: nextMessages },
          };
        }),

      addAgentEvent: (agentOutput) =>
        set((state) => {
          const nextMessages = [
            ...state.messages,
            {
              id: generateId(),
              role: "agent-event" as const,
              content: agentOutput.reasoning || `${agentOutput.agentName} completed`,
              agentName: agentOutput.agentName,
              agentOutput,
              timestamp: new Date().toISOString(),
            },
          ];
          if (!state.activeDocId) return { messages: nextMessages };
          return {
            messages: nextMessages,
            messagesByDoc: { ...state.messagesByDoc, [state.activeDocId]: nextMessages },
          };
        }),

      appendStreamingContent: (content) => {
        const { messages, activeDocId, messagesByDoc } = get();
        const last = messages[messages.length - 1];
        const nextMessages =
          last && last.role === "assistant"
            ? [...messages.slice(0, -1), { ...last, content: last.content + content }]
            : [
                ...messages,
                {
                  id: generateId(),
                  role: "assistant" as const,
                  content,
                  timestamp: new Date().toISOString(),
                },
              ];

        if (!activeDocId) {
          set({ messages: nextMessages });
          return;
        }

        set({
          messages: nextMessages,
          messagesByDoc: { ...messagesByDoc, [activeDocId]: nextMessages },
        });
      },

      setIsStreaming: (streaming) => set({ isStreaming: streaming }),

      clearMessages: () =>
        set((state) => {
          if (!state.activeDocId) return { messages: [] };
          return {
            messages: [],
            messagesByDoc: { ...state.messagesByDoc, [state.activeDocId]: [] },
          };
        }),
    }),
    {
      name: "latex-editor-chat",
      version: 1,
      partialize: (state) => ({
        activeDocId: state.activeDocId,
        messagesByDoc: state.messagesByDoc,
        messages: state.messages,
      }),
    }
  )
);
