"use client";

import { useUIStore } from "@/store/uiStore";
import { useChatStore } from "@/store/chatStore";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const AGENT_LABELS: Record<string, { label: string; color: string }> = {
  writer: { label: "Writer", color: "bg-blue-500" },
  reviewer: { label: "Reviewer", color: "bg-amber-500" },
  formatter: { label: "Formatter", color: "bg-green-500" },
  research: { label: "Research", color: "bg-purple-500" },
};

export function AgentStatusBanner() {
  const runningAgents = useUIStore((s) => s.runningAgents);
  const isStreaming = useChatStore((s) => s.isStreaming);

  if (runningAgents.length === 0) {
    if (!isStreaming) return null;
    return (
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/50">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/50">
      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
      <div className="flex gap-1.5">
        {runningAgents.map((agent) => {
          const info = AGENT_LABELS[agent] || { label: agent, color: "bg-gray-500" };
          return (
            <span
              key={agent}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white",
                info.color
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              {info.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
