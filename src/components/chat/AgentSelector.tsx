"use client";

import { useUIStore } from "@/store/uiStore";
import { AgentName } from "@/types/agent";

const AGENTS: { name: AgentName; label: string; color: string }[] = [
  { name: "writer", label: "Writer", color: "#3b82f6" },
  { name: "reviewer", label: "Reviewer", color: "#f59e0b" },
  { name: "formatter", label: "Formatter", color: "#22c55e" },
  { name: "research", label: "Research", color: "#a855f7" },
];

export function AgentSelector() {
  const { forcedAgents, toggleForcedAgent } = useUIStore();

  return (
    <div className="flex items-center gap-1">
      {AGENTS.map(({ name, label, color }) => {
        const isActive = forcedAgents.includes(name);
        return (
          <button
            key={name}
            onClick={() => toggleForcedAgent(name)}
            className="px-2 py-0.5 rounded-full text-xs font-medium transition-colors border"
            style={{
              backgroundColor: isActive ? color : "transparent",
              borderColor: color,
              color: isActive ? "white" : color,
            }}
            title={`${isActive ? "Unpin" : "Pin"} ${label} agent`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
