# LaTeX Labs – Development Guidelines

This document outlines the project’s structure, coding standards, development workflows, and contribution practices. It is intended for developers and contributors working on the LaTeX Labs codebase.

## 📁 Project Structure & Module Organization

### Overview

```
canvas/
├── src/                    # Core application source
│   ├── app/               # Next.js App Router routes and pages
│   ├── agents/            # LangGraph agent definitions and prompts
│   ├── components/        # Reusable React components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities, LLM clients, LaTeX rendering
│   ├── store/             # Zustand state stores
│   └── types/             # TypeScript type definitions
├── documents/             # Persisted .tex and .meta.json files
├── public/                # Static assets
└── configuration files    # package.json, tsconfig.json, tailwind.config.ts, …
```

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `src/app/` | Next.js App Router routes. Each sub‑folder corresponds to a route segment. API routes live under `src/app/api/`. |
| `src/agents/` | Agent orchestration logic. Contains the LangGraph `graph.ts`, node implementations (`nodes/`), default prompts (`prompts/`), and the shared state type (`state.ts`). |
| `src/components/` | UI components grouped by feature: `chat/`, `editor/`, `settings/`, `layout/`, `ui/`. |
| `src/hooks/` | Custom React hooks for agent streaming, document management, and LaTeX rendering. |
| `src/lib/` | Shared utilities: Gemini wrapper, LLM client factory, file‑system storage, LaTeX parsing/renderering, and generic helpers. |
| `src/store/` | Zustand stores for client‑side state: chat messages, document source, settings, and UI preferences. |
| `src/types/` | Central TypeScript definitions for agents, chat, documents, etc. |
| `documents/` | Server‑side document storage. Each document is stored as a pair: `{id}.tex` (LaTeX source) and `{id}.meta.json` (metadata). |

## 🛠️ Build, Test, and Development Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install project dependencies. |
| `npm run dev` | Start the development server (webpack mode) at [http://localhost:3000](http://localhost:3000). |
| `npm run dev:turbo` | Start the development server with Turbopack (experimental, faster). |
| `npm run lint` | Run ESLint to check code style and potential issues. |
| `npx tsc --noEmit` | Run TypeScript type checks without emitting compiled files. |
| `npm run build` | Create an optimized production build. |
| `npm run start` | Serve the production build. |

**Minimum verification before submitting changes:**
1. `npm run lint` (no errors)
2. `npx tsc --noEmit` (no type errors)
3. Manual flow check using `npm run dev` (ensure the editor and agent pipeline work as expected)

## 🧑‍💻 Coding Style & Naming Conventions

### Language & Formatting

- **Language**: TypeScript with React function components.
- **Indentation**: 2 spaces.
- **Quotes**: Double quotes (`"`) for strings, single quotes for JSX attributes if needed.
- **Semicolons**: Use trailing semicolons.
- **Line length**: Aim for ~100 characters; break lines sensibly.

### Naming

- **Components & Types**: `PascalCase` (e.g., `ChatPanel`, `LaTeXGraphState`).
- **Hooks & Utilities**: `camelCase` (e.g., `useAgentStream`, `parseLatex`).
- **Files**: Match the exported primary entity (e.g., `ChatPanel.tsx` for a component, `useAgentStream.ts` for a hook).
- **Route Folders**: Follow Next.js conventions (e.g., `[docId]` for dynamic segments).

### Organization

- Keep feature‑specific logic close to its domain folder. Avoid cross‑folder circular imports.
- Prefer small, focused modules over large monolithic files.
- Use barrel (`index.ts`) files sparingly; they can be helpful for grouping related exports.

## 🧪 Testing Guidelines

### Current State

There is **no dedicated automated test suite** yet in this repository. All verification is manual and relies on the lint/type‑check steps above.

### Adding Tests

When introducing automated tests:
- Place test files next to the feature they cover, using the suffix `.test.ts` or `.spec.ts` (e.g., `parser.test.ts` alongside `parser.ts`).
- Alternatively, create a `__tests__` directory within the relevant feature folder.
- Use a testing framework of choice (Jest, Vitest, etc.) and ensure the test runner is configured in `package.json`.

### Manual Verification Checklist

For any change that touches:
- **Agent pipeline**: Run a full multi‑hop agent workflow and verify outputs are streamed correctly.
- **LaTeX rendering**: Check that math, sections, tables, and lists render properly in the preview panel.
- **UI components**: Verify responsive behavior, accessibility attributes, and interaction states.
- **API routes**: Test endpoints with both valid and invalid inputs.

## 📝 Commit & Pull Request Guidelines

### Commit Messages

Prefer **Conventional Commits** style:

```
feat(editor): add programmatic mode toggle
fix(chat): prevent duplicate SSE connections
refactor(agents): simplify router node logic
docs: update README with project structure
```

- **Type**: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`.
- **Scope**: Optional, in parentheses, indicating the affected module (e.g., `editor`, `chat`, `agents`).
- **Description**: Brief, imperative summary of the change.

### Pull Requests

Each PR should include:

1. **Purpose Summary** – What problem does this PR solve? What feature does it add?
2. **Affected Paths** – List of files/folders that were modified.
3. **Verification Steps** – Which commands were run (`npm run lint`, `npx tsc --noEmit`, manual tests) and what were the results?
4. **Screenshots/GIFs** – For UI changes, include visual evidence of the change working.
5. **Linked Issues** – Reference any GitHub issues that this PR addresses.

Keep PRs focused and scoped to a single logical change. If a change is large, consider breaking it into smaller, reviewable PRs.

## 🔒 Security & Configuration Tips

### Environment Variables

- Copy `.env.local.example` to `.env.local` and fill in your own keys.
- **Never commit real API keys** to the repository.
- Use environment variables as **fallbacks** for `GOOGLE_API_KEY` and `EXA_API_KEY`. User‑supplied keys from the settings UI take precedence.

### Secrets in Logs

Avoid logging sensitive data (API keys, document contents) in production. The existing code strips keys from error messages, but be mindful when adding new logging statements.

### File‑System Storage

Documents are stored as plain text in the `documents/` directory. In a production deployment, consider:
- Securing the directory with appropriate file permissions.
- Implementing encryption if storing sensitive content.
- Using a dedicated database or object storage for scalability.

## 🚀 Deployment Notes

- Set `NEXT_PUBLIC_SITE_URL` to the production domain for correct metadata and sitemap generation.
- Ensure the `documents/` directory is writable by the server process.
- Monitor agent‑API usage; Gemini and Exa calls may incur costs.

---

*These guidelines are living documents. If you encounter ambiguities or find better practices, please propose updates via a PR.*
