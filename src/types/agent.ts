export type AgentName = "writer" | "reviewer" | "formatter" | "research";

export interface CitationResult {
  title: string;
  url: string;
  snippet: string;
  bibtexKey: string;
  bibtexEntry: string;
}

export interface AgentOutput {
  agentName: AgentName;
  updatedLatex?: string;
  suggestions?: Array<{
    location: string;
    issue: string;
    suggestion: string;
    severity: "info" | "warning" | "error";
  }>;
  citations?: CitationResult[];
  reasoning?: string;
}

export interface GraphInput {
  messages: Array<{ role: string; content: string }>;
  latexDocument: string;
  userInstruction: string;
  forcedAgents?: AgentName[];
}

export interface GraphStateOutput {
  finalLatex: string;
  followupMessage: string;
  agentOutputs: Partial<Record<AgentName, AgentOutput>>;
}
