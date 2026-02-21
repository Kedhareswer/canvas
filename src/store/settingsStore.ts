import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AgentName } from "@/types/agent";

export type PromptAgentName = AgentName | "router" | "aggregator";

export type LLMProvider = "gemini" | "groq";
export type ExecutionMode = "agentic" | "programmatic";

export type GeminiModel =
  | "gemini-2.5-flash"
  | "gemini-2.5-flash-lite"
  | "gemini-2.5-pro"
  | "gemini-3-flash-preview"
  | "gemini-3-pro-preview"
  | "gemini-3.1-pro-preview"
  | "gemini-3-pro-image-preview";

export type GroqModel =
  | "llama-3.3-70b-versatile"
  | "llama-3.1-8b-instant"
  | "qwen/qwen3-32b"
  | "meta-llama/llama-4-scout-17b-16e-instruct"
  | "deepseek-r1-distill-llama-70b";

export type ModelId = GeminiModel | GroqModel;

export interface AgentModelConfig {
  provider: LLMProvider;
  model: ModelId;
  temperature: number;
}

export type CitationStyle = "apa" | "ieee" | "mla" | "chicago" | "harvard";
export type DocumentClass = "article" | "report" | "book" | "beamer" | "letter";

export interface LandingSkills {
  webResearch: boolean;
  deepReview: boolean;
  citationStyle: CitationStyle | null;
  documentClass: DocumentClass | null;
}

export const MODEL_DISPLAY_NAMES: Record<GeminiModel, string> = {
  "gemini-2.5-flash": "Gemini 2.5 Flash",
  "gemini-2.5-flash-lite": "Gemini 2.5 Flash Lite",
  "gemini-2.5-pro": "Gemini 2.5 Pro",
  "gemini-3-flash-preview": "Gemini 3 Flash",
  "gemini-3-pro-preview": "Gemini 3 Pro",
  "gemini-3.1-pro-preview": "Gemini 3.1 Pro",
  "gemini-3-pro-image-preview": "Gemini 3 Pro Image",
};

export const MODEL_TAGS: Partial<Record<GeminiModel, string>> = {
  "gemini-2.5-flash": "Fast",
  "gemini-2.5-flash-lite": "Cheapest",
  "gemini-2.5-pro": "Powerful",
  "gemini-3-flash-preview": "New, Fast",
  "gemini-3-pro-preview": "New, Powerful",
  "gemini-3.1-pro-preview": "Latest",
  "gemini-3-pro-image-preview": "Vision",
};

export const GROQ_MODEL_DISPLAY_NAMES: Record<GroqModel, string> = {
  "llama-3.3-70b-versatile": "Llama 3.3 70B",
  "llama-3.1-8b-instant": "Llama 3.1 8B Instant",
  "qwen/qwen3-32b": "Qwen3 32B",
  "meta-llama/llama-4-scout-17b-16e-instruct": "Llama 4 Scout 17B",
  "deepseek-r1-distill-llama-70b": "DeepSeek R1 70B",
};

export const GROQ_MODEL_TAGS: Partial<Record<GroqModel, string>> = {
  "llama-3.3-70b-versatile": "Versatile",
  "llama-3.1-8b-instant": "Fast",
  "qwen/qwen3-32b": "Balanced",
  "meta-llama/llama-4-scout-17b-16e-instruct": "New",
  "deepseek-r1-distill-llama-70b": "Reasoning",
};

const LEGACY_MODEL_MAP: Record<string, GeminiModel> = {
  "gemini-2.0-flash": "gemini-2.5-flash",
  "gemini-1.5-flash": "gemini-2.5-flash-lite",
  "gemini-1.5-pro": "gemini-2.5-pro",
};

const DEFAULT_LANDING_SKILLS: LandingSkills = {
  webResearch: false,
  deepReview: false,
  citationStyle: null,
  documentClass: null,
};

interface SettingsState {
  googleApiKey: string;
  exaApiKey: string;
  groqApiKey: string;
  customPrompts: Partial<Record<PromptAgentName, string>>;
  agentModelConfigs: Partial<Record<PromptAgentName, AgentModelConfig>>;
  maxHops: number;
  executionMode: ExecutionMode;
  quickProvider: LLMProvider;
  quickModel: ModelId;
  landingSkills: LandingSkills;

  setGoogleApiKey: (key: string) => void;
  setExaApiKey: (key: string) => void;
  setGroqApiKey: (key: string) => void;
  setCustomPrompt: (agent: PromptAgentName, prompt: string | null) => void;
  resetCustomPrompt: (agent: PromptAgentName) => void;
  setAgentModelConfig: (agent: PromptAgentName, cfg: AgentModelConfig) => void;
  resetAgentModelConfig: (agent: PromptAgentName) => void;
  setMaxHops: (n: number) => void;
  setExecutionMode: (mode: ExecutionMode) => void;
  setQuickProvider: (provider: LLMProvider) => void;
  setQuickModel: (model: ModelId) => void;
  setLandingSkills: (skills: Partial<LandingSkills>) => void;
  resetLandingSkills: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      googleApiKey: "",
      exaApiKey: "",
      groqApiKey: "",
      customPrompts: {},
      agentModelConfigs: {},
      maxHops: 2,
      executionMode: "agentic" as ExecutionMode,
      quickProvider: "gemini" as LLMProvider,
      quickModel: "gemini-2.5-flash" as ModelId,
      landingSkills: { ...DEFAULT_LANDING_SKILLS },

      setGoogleApiKey: (key) => set({ googleApiKey: key }),
      setExaApiKey: (key) => set({ exaApiKey: key }),
      setGroqApiKey: (key) => set({ groqApiKey: key }),

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
      setExecutionMode: (mode) => set({ executionMode: mode }),
      setQuickProvider: (provider) => set({ quickProvider: provider }),
      setQuickModel: (model) => set({ quickModel: model }),
      setLandingSkills: (skills) =>
        set((s) => ({ landingSkills: { ...s.landingSkills, ...skills } })),
      resetLandingSkills: () =>
        set({ landingSkills: { ...DEFAULT_LANDING_SKILLS } }),
    }),
    {
      name: "latex-editor-settings",
      version: 5,
      migrate: (persistedState: unknown) => {
        if (!persistedState || typeof persistedState !== "object") return persistedState as SettingsState;
        const state = persistedState as Record<string, unknown>;
        const configs = (state.agentModelConfigs ?? {}) as Record<string, { model?: string; temperature?: number; provider?: string } | undefined>;
        const nextConfigs = Object.fromEntries(
          Object.entries(configs).map(([agent, cfg]) => {
            if (!cfg) return [agent, cfg];
            const mapped = LEGACY_MODEL_MAP[cfg.model ?? ""] ?? cfg.model;
            return [agent, { provider: cfg.provider ?? "gemini", model: mapped, temperature: cfg.temperature ?? 0.7 }];
          })
        ) as SettingsState["agentModelConfigs"];
        return {
          ...state,
          agentModelConfigs: nextConfigs,
          groqApiKey: (state.groqApiKey as string) ?? "",
          executionMode: (state.executionMode as ExecutionMode) ?? "agentic",
          quickProvider: (state.quickProvider as LLMProvider) ?? "gemini",
          quickModel: (state.quickModel as ModelId) ?? "gemini-2.5-flash",
          landingSkills: (state.landingSkills as LandingSkills) ?? { ...DEFAULT_LANDING_SKILLS },
        };
      },
    }
  )
);
