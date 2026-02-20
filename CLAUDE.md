# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run lint     # ESLint check
npm start        # Start production server (after build)
```

## Architecture

**Multi-agent LaTeX editor** — Next.js 15 App Router frontend + LangGraph agent backend + SSE streaming.

### Agent Pipeline

`/api/agent` runs a **multi-hop loop** (1–5 iterations). Each hop:
1. **Router node** (`src/agents/nodes/router.ts`) — decides which agents run via `Send()` parallel fan-out
2. **Agent nodes** (writer, reviewer, formatter, research) — run in parallel, each returns partial state
3. **Aggregator node** (`src/agents/nodes/aggregator.ts`) — merges outputs, emits `{"continueReasoning": true/false}` on last LLM response line

If `continueReasoning=true` and hops remain, the route handler calls `graph.stream()` again with the updated document. The LangGraph graph itself is a single-hop DAG; the loop lives entirely in `src/app/api/agent/route.ts`.

### Settings-as-Headers Pattern

All user settings flow: **localStorage → request headers → LangGraph configurable → agent nodes**

- `settingsStore` (Zustand persist) stores: `googleApiKey`, `exaApiKey`, `customPrompts`, `agentModelConfigs`, `maxHops`
- `useAgentStream.ts` reads the store and sets headers: `X-API-Key`, `X-Exa-Key`, `X-Custom-Prompts` (base64 JSON), `X-Model-Configs` (base64 JSON)
- API route decodes headers and passes via `graph.stream(state, { configurable: { googleApiKey, exaApiKey, customPrompts, modelConfigs } })`
- Each agent node reads `config?.configurable` for its prompt and model overrides; falls back to hardcoded defaults

### Key Directories

```
src/
  agents/
    graph.ts              # StateGraph definition, edges, parallel fan-out via Send()
    state.ts              # LaTeXGraphState — all Annotation fields
    nodes/                # router, writer, reviewer, formatter, research, aggregator
  app/
    api/agent/route.ts    # SSE endpoint + multi-hop loop
    api/settings/validate/route.ts  # Key validation endpoint
    settings/page.tsx     # /settings route
  components/
    layout/               # AppShell, Header, ChatPanel, EditorPanel, PreviewPanel
    settings/             # ApiKeysTab, AgentPromptsTab, ModelTab
  hooks/
    useAgentStream.ts     # SSE client + header injection
  lib/
    gemini.ts             # createGemini(config) — accepts runtime apiKey/model/temperature
    latex-renderer.ts     # Custom LaTeX→HTML AST pipeline (regex + state machine)
  store/
    documentStore.ts      # Source, title, revisions, undo/redo, auto-save
    chatStore.ts          # Messages, agent events, running agents
    settingsStore.ts      # API keys, custom prompts, model configs, maxHops
  types/
    chat.ts               # StreamChunk union — includes hop-start, hop-complete
```

### LaTeX Rendering

Two-layer approach in `src/lib/latex-renderer.ts`:
1. Custom regex+state-machine parser converts LaTeX source → AST → HTML (handles `\section`, environments, tables, lists, math delimiters)
2. KaTeX post-processes math nodes (`$...$`, `$$...$$`, `\(...\)`, `\[...\]`)

`@import "katex/dist/katex.min.css"` **must be the first line** in `src/app/globals.css` — CSS spec requires `@import` before all other rules.

### react-resizable-panels

Import from the package using actual exported names:
```typescript
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
```
`ResizablePanel`, `ResizableHandle`, `ResizablePanelGroup` do **not** exist in this package.

### Document Storage

Documents saved server-side as file pairs in `/documents/`:
- `{id}.tex` — LaTeX source
- `{id}.meta.json` — title, createdAt, updatedAt

### Environment Variables

```
GOOGLE_API_KEY   # Fallback when user hasn't set key in settings UI
EXA_API_KEY      # Fallback for research agent web search
```

Runtime keys from the UI take precedence over env vars.

### Known Behaviors

- **Writer output takes precedence over formatter** in aggregator: if writer ran, its `updatedLatex` is used even if formatter also ran
- **Research agent** generates plausible mock citations (not real web results) unless a valid Exa API key is provided
- **`agentOutputs` resets between hops** — each hop starts with a fresh partial state; the only persistence between hops is `latexDocument` and `followupMessage`
- **Base64 header decode failures** are silently swallowed — bad header = empty config object = agent uses defaults
