import { create } from "zustand";
import { AgentName } from "@/types/agent";

type ViewMode = "source" | "preview" | "split";

interface UIState {
  viewMode: ViewMode;
  runningAgents: AgentName[];
  forcedAgents: AgentName[];
  sidebarOpen: boolean;

  setViewMode: (mode: ViewMode) => void;
  addRunningAgent: (name: AgentName) => void;
  removeRunningAgent: (name: AgentName) => void;
  clearRunningAgents: () => void;
  toggleForcedAgent: (name: AgentName) => void;
  setForcedAgents: (agents: AgentName[]) => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  viewMode: "split",
  runningAgents: [],
  forcedAgents: [],
  sidebarOpen: false,

  setViewMode: (mode) => set({ viewMode: mode }),

  addRunningAgent: (name) =>
    set((state) => ({
      runningAgents: state.runningAgents.includes(name)
        ? state.runningAgents
        : [...state.runningAgents, name],
    })),

  removeRunningAgent: (name) =>
    set((state) => ({
      runningAgents: state.runningAgents.filter((n) => n !== name),
    })),

  clearRunningAgents: () => set({ runningAgents: [] }),

  toggleForcedAgent: (name) =>
    set((state) => ({
      forcedAgents: state.forcedAgents.includes(name)
        ? state.forcedAgents.filter((n) => n !== name)
        : [...state.forcedAgents, name],
    })),

  setForcedAgents: (agents) => set({ forcedAgents: agents }),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
