import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AgentName } from "@/types/agent";

export type PromptAgentName = AgentName | "router" | "aggregator";

export type GeminiModel =
  | "gemini-2.5-flash"
  | "gemini-2.5-flash-lite"
  | "gemini-2.5-pro"
  | "gemini-3-flash-preview"
  | "gemini-3-pro-preview"
  | "gemini-3.1-pro-preview"
  | "gemini-3-pro-image-preview";

export interface AgentModelConfig {
  model: GeminiModel;
  temperature: number;
}

const LEGACY_MODEL_MAP: Record<string, GeminiModel> = {
  "gemini-2.0-flash": "gemini-2.5-flash",
  "gemini-1.5-flash": "gemini-2.5-flash-lite",
  "gemini-1.5-pro": "gemini-2.5-pro",
};

interface SettingsState {
  googleApiKey: string;
  exaApiKey: string;
  customPrompts: Partial<Record<PromptAgentName, string>>;
  agentModelConfigs: Partial<Record<PromptAgentName, AgentModelConfig>>;
  maxHops: number;

  setGoogleApiKey: (key: string) => void;
  setExaApiKey: (key: string) => void;
  setCustomPrompt: (agent: PromptAgentName, prompt: string | null) => void;
  resetCustomPrompt: (agent: PromptAgentName) => void;
  setAgentModelConfig: (agent: PromptAgentName, cfg: AgentModelConfig) => void;
  resetAgentModelConfig: (agent: PromptAgentName) => void;
  setMaxHops: (n: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      googleApiKey: "",
      exaApiKey: "",
      customPrompts: {},
      agentModelConfigs: {},
      maxHops: 2,

      setGoogleApiKey: (key) => set({ googleApiKey: key }),
      setExaApiKey: (key) => set({ exaApiKey: key }),

      setCustomPrompt: (agent, prompt) =>
        set((s) => {
          if (prompt === null) {
            const { [agent]: _removed, ...rest } = s.customPrompts;
            return { customPrompts: rest };
          }
          return { customPrompts: { ...s.customPrompts, [agent]: prompt } };
        }),

      resetCustomPrompt: (agent) =>
        set((s) => {
          const { [agent]: _removed, ...rest } = s.customPrompts;
          return { customPrompts: rest };
        }),

      setAgentModelConfig: (agent, cfg) =>
        set((s) => ({
          agentModelConfigs: { ...s.agentModelConfigs, [agent]: cfg },
        })),

      resetAgentModelConfig: (agent) =>
        set((s) => {
          const { [agent]: _removed, ...rest } = s.agentModelConfigs;
          return { agentModelConfigs: rest };
        }),

      setMaxHops: (n) => set({ maxHops: Math.min(5, Math.max(1, n)) }),
    }),
    {
      name: "latex-editor-settings",
      version: 2,
      migrate: (persistedState: unknown) => {
        if (!persistedState || typeof persistedState !== "object") return persistedState as SettingsState;
        const state = persistedState as SettingsState;
        const nextConfigs = Object.fromEntries(
          Object.entries(state.agentModelConfigs ?? {}).map(([agent, cfg]) => {
            if (!cfg) return [agent, cfg];
            const mapped = LEGACY_MODEL_MAP[cfg.model] ?? cfg.model;
            return [agent, { ...cfg, model: mapped }];
          })
        ) as SettingsState["agentModelConfigs"];
        return { ...state, agentModelConfigs: nextConfigs };
      },
    }
  )
);
