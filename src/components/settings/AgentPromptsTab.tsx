"use client";

import { useState } from "react";
import { useSettingsStore, PromptAgentName } from "@/store/settingsStore";
import { Button } from "@/components/ui/button";
import { RotateCcw, Save, ChevronDown, ChevronUp } from "lucide-react";
import { WRITER_SYSTEM_PROMPT } from "@/agents/prompts/writer";
import { REVIEWER_SYSTEM_PROMPT } from "@/agents/prompts/reviewer";
import { FORMATTER_SYSTEM_PROMPT } from "@/agents/prompts/formatter";
import { RESEARCH_SYSTEM_PROMPT } from "@/agents/prompts/research";
import { ROUTER_PROMPT } from "@/agents/nodes/router";
import { AGGREGATOR_PROMPT } from "@/agents/nodes/aggregator";

const DEFAULT_PROMPTS: Record<PromptAgentName, string> = {
  writer: WRITER_SYSTEM_PROMPT,
  reviewer: REVIEWER_SYSTEM_PROMPT,
  formatter: FORMATTER_SYSTEM_PROMPT,
  research: RESEARCH_SYSTEM_PROMPT,
  router: ROUTER_PROMPT,
  aggregator: AGGREGATOR_PROMPT,
};

const AGENT_META: Record<PromptAgentName, { label: string; color: string; description: string }> = {
  writer: {
    label: "Writer",
    color: "bg-blue-500",
    description: "Generates and rewrites LaTeX document content",
  },
  reviewer: {
    label: "Reviewer",
    color: "bg-amber-500",
    description: "Reviews grammar, clarity, and academic quality",
  },
  formatter: {
    label: "Formatter",
    color: "bg-green-500",
    description: "Improves formatting without changing content",
  },
  research: {
    label: "Research",
    color: "bg-purple-500",
    description: "Finds citations and generates BibTeX entries",
  },
  router: {
    label: "Router",
    color: "bg-gray-500",
    description: "Classifies user intent and selects which agents to run",
  },
  aggregator: {
    label: "Aggregator",
    color: "bg-rose-500",
    description: "Merges agent outputs and generates the followup message",
  },
};

const AGENTS: PromptAgentName[] = ["writer", "reviewer", "formatter", "research", "router", "aggregator"];

function AgentPromptCard({ agent }: { agent: PromptAgentName }) {
  const { customPrompts, setCustomPrompt, resetCustomPrompt } = useSettingsStore();
  const meta = AGENT_META[agent];
  const defaultPrompt = DEFAULT_PROMPTS[agent];
  const isCustom = agent in customPrompts;

  const [draft, setDraft] = useState(customPrompts[agent] ?? defaultPrompt);
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);
  const textareaId = `${agent}-prompt-editor`;

  const handleSave = () => {
    if (draft.trim() === defaultPrompt.trim()) {
      resetCustomPrompt(agent);
    } else {
      setCustomPrompt(agent, draft);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setDraft(defaultPrompt);
    resetCustomPrompt(agent);
  };

  return (
    <div className={`rounded-lg border ${isCustom ? "border-amber-300 bg-amber-50/50" : "border-border"}`}>
      <button
        className="w-full flex items-center justify-between p-4 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full ${meta.color}`} />
          <div>
            <span className="text-sm font-semibold">{meta.label}</span>
            {isCustom && (
              <span className="ml-2 text-xs bg-amber-100 text-amber-700 border border-amber-300 px-1.5 py-0.5 rounded-full">
                Custom
              </span>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          <label htmlFor={textareaId} className="sr-only">
            {meta.label} system prompt
          </label>
          <textarea
            id={textareaId}
            className="w-full h-48 rounded-md border border-input bg-background px-3 py-2 text-xs font-mono resize-y focus:outline-none focus:ring-1 focus:ring-ring leading-relaxed"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
          />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSave} variant={saved ? "secondary" : "default"}>
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {saved ? "Saved!" : "Save"}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleReset} disabled={!isCustom}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset to Default
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AgentPromptsTab() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Customize the system prompt for each agent. Changes are saved to localStorage and sent with
        every request. Click an agent to expand its prompt editor.
      </p>
      {AGENTS.map((agent) => (
        <AgentPromptCard key={agent} agent={agent} />
      ))}
    </div>
  );
}
