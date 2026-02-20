import { StateGraph, Send, START, END } from "@langchain/langgraph";
import { LaTeXGraphAnnotation, LaTeXGraphState } from "./state";
import { routerNode } from "./nodes/router";
import { writerAgent } from "./nodes/writer";
import { reviewerAgent } from "./nodes/reviewer";
import { formatterAgent } from "./nodes/formatter";
import { researchAgent } from "./nodes/research";
import { aggregatorNode } from "./nodes/aggregator";
import { AgentName } from "@/types/agent";

function fanOutAgents(state: LaTeXGraphState): Send[] {
  return state.activeAgents.map(
    (agentName) => new Send(agentName, { ...state })
  );
}

const ALL_AGENT_NAMES: AgentName[] = [
  "writer",
  "reviewer",
  "formatter",
  "research",
];

const builder = new StateGraph(LaTeXGraphAnnotation)
  .addNode("router", routerNode)
  .addNode("writer", writerAgent)
  .addNode("reviewer", reviewerAgent)
  .addNode("formatter", formatterAgent)
  .addNode("research", researchAgent)
  .addNode("aggregator", aggregatorNode)
  .addEdge(START, "router")
  .addConditionalEdges("router", fanOutAgents, ALL_AGENT_NAMES)
  .addEdge("writer", "aggregator")
  .addEdge("reviewer", "aggregator")
  .addEdge("formatter", "aggregator")
  .addEdge("research", "aggregator")
  .addEdge("aggregator", END);

export const graph = builder.compile();
