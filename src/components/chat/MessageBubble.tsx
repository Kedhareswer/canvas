"use client";

import { ChatMessage } from "@/types/chat";
import { cn } from "@/lib/utils";
import { Bot, User, Zap } from "lucide-react";

const AGENT_COLORS: Record<string, string> = {
  writer: "text-blue-500 bg-blue-50",
  reviewer: "text-amber-500 bg-amber-50",
  formatter: "text-green-500 bg-green-50",
  research: "text-purple-500 bg-purple-50",
};

export function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end gap-2">
        <div className="bg-primary text-primary-foreground rounded-lg px-3 py-2 max-w-[85%] text-sm">
          {message.content}
        </div>
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-3.5 w-3.5 text-primary" />
        </div>
      </div>
    );
  }

  if (message.role === "agent-event") {
    const agentColor = AGENT_COLORS[message.agentName || ""] || "text-gray-500 bg-gray-50";
    return (
      <div className="flex gap-2">
        <div className={cn("flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center", agentColor)}>
          <Zap className="h-3.5 w-3.5" />
        </div>
        <div className={cn("rounded-lg px-3 py-2 max-w-[85%] text-xs", agentColor)}>
          <span className="font-semibold capitalize">{message.agentName}</span>
          <span className="ml-1">{message.content}</span>
          {message.agentOutput?.suggestions && (
            <ul className="mt-1 space-y-1">
              {message.agentOutput.suggestions.slice(0, 3).map((s, i) => (
                <li key={i} className="text-xs opacity-80">
                  {s.severity === "error" ? "!!" : s.severity === "warning" ? "!" : "-"}{" "}
                  {s.location}: {s.issue}
                </li>
              ))}
            </ul>
          )}
          {message.agentOutput?.citations && (
            <ul className="mt-1 space-y-1">
              {message.agentOutput.citations.slice(0, 3).map((c, i) => (
                <li key={i} className="text-xs opacity-80">
                  [{c.bibtexKey}] {c.title}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex gap-2">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
        <Bot className="h-3.5 w-3.5 text-secondary-foreground" />
      </div>
      <div className="bg-secondary text-secondary-foreground rounded-lg px-3 py-2 max-w-[85%] text-sm whitespace-pre-wrap">
        {message.content}
      </div>
    </div>
  );
}
