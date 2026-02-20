import { Annotation, MessagesAnnotation } from "@langchain/langgraph";
import { AgentName, AgentOutput } from "@/types/agent";

export const LaTeXGraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  latexDocument: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
  userInstruction: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
  activeAgents: Annotation<AgentName[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  agentOutputs: Annotation<Partial<Record<AgentName, AgentOutput>>>({
    reducer: (prev, next) => ({ ...prev, ...next }),
    default: () => ({}),
  }),
  finalLatex: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
  followupMessage: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
  forcedAgents: Annotation<AgentName[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  continueReasoning: Annotation<boolean>({
    reducer: (_prev, next) => next,
    default: () => false,
  }),
  hopCount: Annotation<number>({
    reducer: (_prev, next) => next,
    default: () => 0,
  }),
});

export type LaTeXGraphState = typeof LaTeXGraphAnnotation.State;
