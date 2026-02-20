"use client";

import { useSettingsStore, PromptAgentName, GeminiModel, AgentModelConfig } from "@/store/settingsStore";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

const AGENTS: PromptAgentName[] = ["router", "writer", "reviewer", "formatter", "research", "aggregator"];

const DEFAULT_CONFIGS: Record<PromptAgentName, AgentModelConfig> = {
  router:      { model: "gemini-2.5-flash", temperature: 0 },
  writer:      { model: "gemini-2.5-flash", temperature: 0.7 },
  reviewer:    { model: "gemini-2.5-flash", temperature: 0.3 },
  formatter:   { model: "gemini-2.5-flash", temperature: 0.3 },
  research:    { model: "gemini-2.5-flash", temperature: 0.5 },
  aggregator:  { model: "gemini-2.5-flash", temperature: 0.5 },
};

const AGENT_COLORS: Record<PromptAgentName, string> = {
  writer: "bg-blue-500",
  reviewer: "bg-amber-500",
  formatter: "bg-green-500",
  research: "bg-purple-500",
  router: "bg-gray-500",
  aggregator: "bg-rose-500",
};

const MODELS: GeminiModel[] = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro",
  "gemini-3-flash-preview",
  "gemini-3-pro-preview",
  "gemini-3.1-pro-preview",
  "gemini-3-pro-image-preview",
];

export function ModelTab() {
  const { agentModelConfigs, setAgentModelConfig, resetAgentModelConfig, maxHops, setMaxHops } =
    useSettingsStore();

  return (
    <div className="space-y-8">
      {/* Per-agent model config */}
      <div>
        <h3 className="text-sm font-semibold mb-1">Per-Agent Model Configuration</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Override the Gemini model and temperature for each agent individually.
        </p>
        <div className="space-y-3">
          {AGENTS.map((agent) => {
            const current = agentModelConfigs[agent] ?? DEFAULT_CONFIGS[agent];
            const isCustom = agent in agentModelConfigs;
            const modelSelectId = `${agent}-model-select`;
            const temperatureInputId = `${agent}-temperature-input`;

            return (
              <div key={agent} className={`flex items-center gap-3 p-3 rounded-lg border ${isCustom ? "border-amber-300 bg-amber-50/50" : "border-border bg-muted/20"}`}>
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${AGENT_COLORS[agent]}`} />
                <span className="w-24 text-sm font-medium capitalize shrink-0">{agent}</span>

                <div className="flex items-center gap-2 flex-1">
                  <label htmlFor={modelSelectId} className="sr-only">
                    {agent} model
                  </label>
                  <select
                    id={modelSelectId}
                    value={current.model}
                    onChange={(e) =>
                      setAgentModelConfig(agent, {
                        ...current,
                        model: e.target.value as GeminiModel,
                      })
                    }
                    className="flex-1 text-xs border border-input rounded-md px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {MODELS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <label htmlFor={temperatureInputId} className="text-xs text-muted-foreground">
                      Temp
                    </label>
                    <input
                      id={temperatureInputId}
                      type="number"
                      min={0}
                      max={1}
                      step={0.1}
                      value={current.temperature}
                      onChange={(e) =>
                        setAgentModelConfig(agent, {
                          ...current,
                          temperature: Math.min(1, Math.max(0, parseFloat(e.target.value) || 0)),
                        })
                      }
                      className="w-16 text-xs border border-input rounded-md px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>

                  {isCustom && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => resetAgentModelConfig(agent)}
                      title="Reset to default"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Multi-hop settings */}
      <div>
        <h3 className="text-sm font-semibold mb-1">Multi-Hop Orchestration</h3>
        <p className="text-xs text-muted-foreground mb-4">
          After each agent pass, the system evaluates whether another pass is needed
          (e.g., research → writer, reviewer → writer). Set the maximum number of passes.
        </p>
        <div className="flex items-center gap-4 p-3 rounded-lg border border-border bg-muted/20">
          <div className="flex-1">
            <label className="text-sm font-medium">Maximum hops</label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Each hop is a full agent graph execution. Default: 2, max: 5.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setMaxHops(maxHops - 1)}
              disabled={maxHops <= 1}
              className="w-8 h-8 rounded-md border border-input bg-background flex items-center justify-center text-sm hover:bg-accent disabled:opacity-40"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-semibold tabular-nums">{maxHops}</span>
            <button
              onClick={() => setMaxHops(maxHops + 1)}
              disabled={maxHops >= 5}
              className="w-8 h-8 rounded-md border border-input bg-background flex items-center justify-center text-sm hover:bg-accent disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          {[1, 2, 3, 5].map((n) => (
            <button
              key={n}
              onClick={() => setMaxHops(n)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                maxHops === n
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:bg-accent"
              }`}
            >
              {n === 1 ? "Single" : n === 2 ? "2 (Default)" : n === 3 ? "3" : "5 (Max)"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
