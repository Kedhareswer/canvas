"use client";

import { useSettingsStore, PromptAgentName, GeminiModel, GroqModel, LLMProvider, ExecutionMode, AgentModelConfig, MODEL_DISPLAY_NAMES, GROQ_MODEL_DISPLAY_NAMES } from "@/store/settingsStore";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

const AGENTS: PromptAgentName[] = ["router", "writer", "reviewer", "formatter", "research", "aggregator"];

const DEFAULT_CONFIGS: Record<PromptAgentName, AgentModelConfig> = {
  router:      { provider: "gemini", model: "gemini-2.5-flash", temperature: 0 },
  writer:      { provider: "gemini", model: "gemini-2.5-flash", temperature: 0.7 },
  reviewer:    { provider: "gemini", model: "gemini-2.5-flash", temperature: 0.3 },
  formatter:   { provider: "gemini", model: "gemini-2.5-flash", temperature: 0.3 },
  research:    { provider: "gemini", model: "gemini-2.5-flash", temperature: 0.5 },
  aggregator:  { provider: "gemini", model: "gemini-2.5-flash", temperature: 0.5 },
};

const AGENT_COLORS: Record<PromptAgentName, string> = {
  writer: "bg-blue-500",
  reviewer: "bg-amber-500",
  formatter: "bg-green-500",
  research: "bg-purple-500",
  router: "bg-gray-500",
  aggregator: "bg-rose-500",
};

const GEMINI_MODELS: GeminiModel[] = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro",
  "gemini-3-flash-preview",
  "gemini-3-pro-preview",
  "gemini-3.1-pro-preview",
  "gemini-3-pro-image-preview",
];

const GROQ_MODELS: GroqModel[] = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "qwen/qwen3-32b",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "deepseek-r1-distill-llama-70b",
];

function getModelDisplayName(model: string): string {
  if (model in MODEL_DISPLAY_NAMES) return MODEL_DISPLAY_NAMES[model as GeminiModel];
  if (model in GROQ_MODEL_DISPLAY_NAMES) return GROQ_MODEL_DISPLAY_NAMES[model as GroqModel];
  return model;
}

export function ModelTab() {
  const { agentModelConfigs, setAgentModelConfig, resetAgentModelConfig, maxHops, setMaxHops, executionMode, setExecutionMode } =
    useSettingsStore();

  return (
    <div className="space-y-8">
      {/* Per-agent model config */}
      <div>
        <h3 className="text-sm font-semibold mb-1">Per-Agent Model Configuration</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Override the provider, model, and temperature for each agent individually.
        </p>
        <div className="space-y-3">
          {AGENTS.map((agent) => {
            const current = agentModelConfigs[agent] ?? DEFAULT_CONFIGS[agent];
            const provider = current.provider ?? "gemini";
            const models = provider === "groq" ? GROQ_MODELS : GEMINI_MODELS;
            const isCustom = agent in agentModelConfigs;
            const providerSelectId = `${agent}-provider-select`;
            const modelSelectId = `${agent}-model-select`;
            const temperatureInputId = `${agent}-temperature-input`;

            return (
              <div key={agent} className={`p-3 rounded-lg border ${isCustom ? "border-amber-300 bg-amber-50/50" : "border-border bg-muted/20"}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${AGENT_COLORS[agent]}`} />
                  <span className="text-sm font-medium capitalize flex-1">{agent}</span>

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

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Provider toggle */}
                  <div className="flex items-center shrink-0">
                    <label htmlFor={providerSelectId} className="sr-only">
                      {agent} provider
                    </label>
                    <div className="flex rounded-md border border-input overflow-hidden">
                      {(["gemini", "groq"] as LLMProvider[]).map((p) => (
                        <button
                          key={p}
                          onClick={() => {
                            const defaultModel = p === "groq" ? "llama-3.3-70b-versatile" : "gemini-2.5-flash";
                            setAgentModelConfig(agent, {
                              ...current,
                              provider: p,
                              model: defaultModel,
                            });
                          }}
                          className={`px-2.5 py-1 text-xs font-medium transition ${
                            provider === p
                              ? "bg-primary text-primary-foreground"
                              : "bg-background text-muted-foreground hover:bg-accent"
                          }`}
                        >
                          {p === "gemini" ? "Gemini" : "Groq"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Model selector */}
                  <label htmlFor={modelSelectId} className="sr-only">
                    {agent} model
                  </label>
                  <select
                    id={modelSelectId}
                    value={current.model}
                    onChange={(e) =>
                      setAgentModelConfig(agent, {
                        ...current,
                        model: e.target.value as GeminiModel | GroqModel,
                      })
                    }
                    className="flex-1 min-w-[140px] text-xs border border-input rounded-md px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {models.map((m) => (
                      <option key={m} value={m}>{getModelDisplayName(m)}</option>
                    ))}
                  </select>

                  {/* Temperature */}
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
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Multi-hop settings */}
      <div>
        <h3 className="text-sm font-semibold mb-1">Execution Mode</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Choose between the current multi-agent graph or programmatic tool orchestration.
        </p>
        <div className="flex gap-2 p-3 rounded-lg border border-border bg-muted/20">
          {([
            {
              id: "agentic",
              title: "Agentic Graph",
              desc: "Router + specialist agents across configurable hops.",
            },
            {
              id: "programmatic",
              title: "Programmatic",
              desc: "Planner generates JS plan, sandbox runs tools in parallel, final writer synthesizes output.",
            },
          ] as { id: ExecutionMode; title: string; desc: string }[]).map((mode) => (
            <button
              key={mode.id}
              onClick={() => setExecutionMode(mode.id)}
              className={`flex-1 rounded-md border px-3 py-2 text-left transition ${
                executionMode === mode.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:bg-accent"
              }`}
            >
              <div className="text-sm font-semibold">{mode.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{mode.desc}</div>
            </button>
          ))}
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
