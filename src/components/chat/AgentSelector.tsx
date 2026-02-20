"use client";

import { useUIStore } from "@/store/uiStore";
import { AgentName } from "@/types/agent";

const AGENTS: { name: AgentName; label: string; color: string }[] = [
  { name: "writer", label: "Writer", color: "border-blue-500 text-blue-500 data-[active=true]:bg-blue-500 data-[active=true]:text-white" },
  { name: "reviewer", label: "Reviewer", color: "border-amber-500 text-amber-500 data-[active=true]:bg-amber-500 data-[active=true]:text-white" },
  { name: "formatter", label: "Formatter", color: "border-green-500 text-green-500 data-[active=true]:bg-green-500 data-[active=true]:text-white" },
  { name: "research", label: "Research", color: "border-purple-500 text-purple-500 data-[active=true]:bg-purple-500 data-[active=true]:text-white" },
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
            className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors border bg-transparent ${color}`}
            data-active={isActive}
            title={`${isActive ? "Unpin" : "Pin"} ${label} agent`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
