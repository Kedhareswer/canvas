import { AgentName } from "@/types/agent";

export interface RouterDecision {
  activeAgents: AgentName[];
  reasoning: string;
}
