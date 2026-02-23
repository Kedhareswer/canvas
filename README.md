# LaTeX Labs – Multi‑Agent LaTeX Editor

LaTeX Labs is a collaborative, AI‑assisted LaTeX editor that integrates a multi‑agent workflow for drafting, reviewing, formatting, and researching academic documents. Built with Next.js, LangGraph, and Gemini, it provides a seamless environment where human editing and automated agent assistance work together.

## ✨ Key Features

- **Multi‑Agent Orchestration** – A LangGraph‑based pipeline with six specialized agents:
  - **Writer** – Expands and drafts content
  - **Reviewer** – Critiques and suggests improvements
  - **Formatter** – Ensures proper LaTeX syntax and style
  - **Research** – Fetches relevant citations and background (optional Exa integration)
  - **Router** – Dynamically decides which agents to run
  - **Aggregator** – Merges parallel outputs and decides whether to continue reasoning
- **Real‑Time Editor + Chat** – Side‑by‑side LaTeX source editing and conversational interaction with agents.
- **Fully Configurable Agents** – Per‑agent custom prompts, model selection, and temperature settings via the UI.
- **Local Document Storage** – Automatic versioning and revision history stored as `.tex` + `.meta.json` files.
- **Production‑Ready SEO** – Built‑in sitemap, robots.txt, dynamic Open Graph and Twitter images.
- **Streaming API** – Server‑Sent Events (SSE) deliver incremental agent outputs with hop‑by‑hop progress indicators.

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router) with React 19 & TypeScript
- **Styling**: Tailwind CSS
- **Agent Engine**: LangChain + LangGraph
- **LLM Provider**: Google Gemini (2.5‑series and 3.x‑preview models)
- **Client State**: Zustand with persistent storage
- **UI Components**: Radix‑UI primitives, react‑resizable‑panels
- **LaTeX Rendering**: Custom AST parser + KaTeX for math

## 📁 Project Structure

```
canvas/
├── src/
│   ├── app/                    # Next.js App Router routes
│   │   ├── api/               # API endpoints (agent, documents, images, settings)
│   │   ├── editor/[docId]/    # Main editor interface
│   │   ├── settings/          # Configuration pages
│   │   ├── layout.tsx         # Root layout with metadata
│   │   ├── page.tsx           # Landing page
│   │   ├── sitemap.ts         # XML sitemap generation
│   │   ├── robots.ts          # robots.txt generation
│   │   ├── opengraph‑image.tsx # Dynamic OG images
│   │   └── twitter‑image.tsx  # Dynamic Twitter images
│   ├── agents/                # LangGraph agent definitions
│   │   ├── graph.ts           # StateGraph definition and edges
│   │   ├── state.ts           # LaTeXGraphState type
│   │   ├── nodes/             # Individual agent nodes (router, writer, …)
│   │   └── prompts/           # Default prompts per agent
│   ├── components/            # Reusable UI components
│   │   ├── chat/              # Chat panel, input, message bubbles
│   │   ├── editor/            # Editor toolbar, LaTeX preview, source editor
│   │   ├── layout/            # App shell, header, resizable panels
│   │   ├── settings/          # API keys, model, prompts configuration tabs
│   │   └── ui/                # Base UI primitives (Button, Skeleton)
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAgentStream.ts  # SSE client with header injection
│   │   ├── useLatexDocument.ts # Document state and auto‑save
│   │   └── useLatexRenderer.ts # LaTeX rendering hook
│   ├── lib/                   # Utilities and shared logic
│   │   ├── gemini‑image.ts    # Gemini image‑generation wrapper
│   │   ├── llm.ts             # LLM client factory
│   │   ├── storage.ts         # File‑system document storage
│   │   ├── utils.ts           # Generic helpers
│   │   └── latex/             # LaTeX parsing, rendering, templates
│   ├── store/                 # Zustand stores
│   │   ├── chatStore.ts       # Chat messages and agent events
│   │   ├── documentStore.ts   # Current document source and revisions
│   │   ├── settingsStore.ts   # API keys, custom prompts, model configs
│   │   └── uiStore.ts         # UI state (panel sizes, theme)
│   └── types/                 # TypeScript type definitions
├── documents/                 # Persisted .tex and .meta.json files
├── public/                    # Static assets
└── * configuration files (package.json, tsconfig.json, tailwind.config.ts, …)
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- A Google AI Studio API key (for Gemini)
- (Optional) Exa API key for web‑search capabilities

### Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment template and fill in your keys:
   ```bash
   cp .env.local.example .env.local
   ```
   Edit `.env.local`:
   ```env
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   GOOGLE_API_KEY=your‑google‑ai‑studio‑key
   EXA_API_KEY=your‑exa‑api‑key  # optional
   LANGCHAIN_TRACING_V2=false    # set to true if using LangSmith
   LANGCHAIN_API_KEY=            # optional
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (webpack mode, stable on Windows) |
| `npm run dev:turbo` | Start dev server with Turbopack (faster, experimental) |
| `npm run build` | Create an optimized production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint checks |
| `npx tsc --noEmit` | Type‑check the project without emitting files |

## ⚙️ Configuration

### Agent Settings

All agent configuration is managed through the **Settings** page (`/settings`):

- **API Keys** – Provide your own Gemini and Exa keys (overrides environment variables).
- **Model Configuration** – Select a different Gemini model and temperature per agent.
- **Custom Prompts** – Override the default system prompt for each agent.
- **Max Hops** – Control how many reasoning iterations the agent pipeline may perform (1–5).

Settings are stored in the browser’s local storage and sent as HTTP headers to the API, enabling runtime customization without server‑side changes.

### LaTeX Rendering

The editor uses a two‑stage rendering pipeline:
1. A custom regex‑based parser converts LaTeX source to an AST and then to HTML (handling sections, environments, tables, lists).
2. KaTeX processes math delimiters (`$…$`, `$$…$$`, `\(…\)`, `\[…\]`).

KaTeX CSS is imported at the top of `src/app/globals.css` as required by CSS specification.

### Document Storage

Documents are saved server‑side in the `documents/` directory as two files:
- `{uuid}.tex` – The LaTeX source.
- `{uuid}.meta.json` – Metadata (title, creation time, last update).

The API endpoints (`/api/documents`) provide CRUD operations for loading and saving.

## 🔧 Development Notes

### Agent Pipeline Flow

1. The frontend sends a request to `/api/agent` with the current LaTeX source and a follow‑up message.
2. The route runs a **multi‑hop loop** (1–5 iterations). Each hop:
   - The **router** node decides which agents should run and fans out parallel `Send()` calls.
   - The selected agents (writer, reviewer, formatter, research) execute concurrently.
   - The **aggregator** merges their outputs and decides whether to continue reasoning (`continueReasoning` flag).
3. If `continueReasoning` is `true` and hops remain, the loop repeats with the updated document.
4. Server‑Sent Events stream incremental updates (hop‑start, agent‑output, hop‑complete) to the client.

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `GOOGLE_API_KEY` | Fallback Gemini API key (used if the user hasn’t provided one in the UI) |
| `EXA_API_KEY` | Fallback Exa API key for the research agent’s web search |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for metadata and sitemap generation |
| `LANGCHAIN_TRACING_V2` | Enable LangSmith tracing (requires `LANGCHAIN_API_KEY`) |

**Important**: User‑supplied keys from the settings UI take precedence over environment variables.

## 📄 Documentation

- **[AGENTS.md](AGENTS.md)** – Detailed repository guidelines, coding conventions, and development workflows.
- **[CLAUDE.md](CLAUDE.md)** – Internal notes for AI assistants working with the codebase.

## 🧪 Testing & Quality

- Run `npm run lint` and `npx tsc --noEmit` before committing to catch style and type errors.
- Manual verification should include a full agent workflow in the development server.
- Automated tests are not yet implemented; test files should be placed next to the feature they cover (`.test.ts` / `.spec.ts`).

## 📦 Deployment

1. Set the required environment variables on your hosting platform.
2. Build the project:
   ```bash
   npm run build
   ```
3. Start the production server:
   ```bash
   npm run start
   ```

Ensure `NEXT_PUBLIC_SITE_URL` is set to your production domain for correct metadata and sitemap generation.

## 📝 License

This project is provided for educational and research purposes. See the repository for license details.

---

*LaTeX Labs is an experimental showcase of multi‑agent systems integrated into a modern web editor. Contributions and feedback are welcome.*
