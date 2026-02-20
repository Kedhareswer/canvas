import { AgentName, AgentOutput } from "./agent";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "agent-event";
  content: string;
  agentName?: AgentName;
  agentOutput?: AgentOutput;
  timestamp: string;
}

export interface StreamChunk {
  type:
    | "agent-start"
    | "agent-output"
    | "latex-update"
    | "followup"
    | "done"
    | "error"
    | "hop-start"
    | "hop-complete";
  agentName?: AgentName;
  partialLatex?: string;
  followupContent?: string;
  agentOutputs?: Partial<Record<AgentName, AgentOutput>>;
  error?: string;
  hopNumber?: number;
  hopReason?: string;
  totalHops?: number;
}
