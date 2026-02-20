# Canvas

Canvas is a multi-agent LaTeX editor built with Next.js, LangChain, and Gemini.  
It helps you draft, review, format, and research academic documents in one workflow.

## Features

- Multi-agent orchestration with LangGraph:
  - `writer`
  - `reviewer`
  - `formatter`
  - `research`
  - `router`
  - `aggregator`
- Real-time editing + chat-assisted iteration
- Per-agent prompt customization
- Per-agent model + temperature configuration
- Local document storage with revision history
- Optional Exa-powered web research
- SEO-ready metadata, sitemap, robots, and social cards

## Tech Stack

- Next.js 15 (App Router)
- React 19 + TypeScript
- Tailwind CSS
- LangChain + LangGraph
- Gemini models (`2.5` and `3.x` preview options)
- Zustand for client state

## Project Structure

```text
src/
  app/
    page.tsx                     # Landing page
    editor/[docId]/page.tsx      # Main editor route
    settings/page.tsx            # Model/prompt/API key settings
    api/                         # API routes
    sitemap.ts                   # XML sitemap
    robots.ts                    # robots.txt
    opengraph-image.tsx          # Dynamic OG image
    twitter-image.tsx            # Dynamic Twitter image
  agents/                        # Agent nodes, prompts, graph
  components/                    # UI and feature components
  hooks/                         # Client hooks
  lib/                           # Storage, Gemini wrappers, LaTeX utilities
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.local.example` to `.env.local` and set values:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
GOOGLE_API_KEY=your-google-ai-studio-key
EXA_API_KEY=your-exa-api-key-optional
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your-langsmith-key-optional
```

### 3. Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

- `npm run dev` - Start dev server (webpack mode, stable on Windows)
- `npm run dev:turbo` - Start dev server with Turbopack
- `npm run build` - Production build
- `npm run start` - Run production server
- `npx tsc --noEmit` - Type check

## SEO and Social Preview Setup

This project includes production-friendly SEO defaults:

- Global metadata in `src/app/layout.tsx`
  - title templates
  - description
  - keywords
  - Open Graph metadata
  - Twitter metadata
- `src/app/sitemap.ts` generates `/sitemap.xml`
- `src/app/robots.ts` generates `/robots.txt`
- Dynamic social images:
  - `/opengraph-image` from `src/app/opengraph-image.tsx`
  - `/twitter-image` from `src/app/twitter-image.tsx`

To make metadata URL resolution and sitemap host correct in production, set:

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## Model Notes

- Default runtime model: `gemini-2.5-flash`
- Supported in settings:
  - `gemini-2.5-flash`
  - `gemini-2.5-flash-lite`
  - `gemini-2.5-pro`
  - `gemini-3-flash-preview`
  - `gemini-3-pro-preview`
  - `gemini-3.1-pro-preview`
  - `gemini-3-pro-image-preview`

## Accessibility

Recent updates include explicit label associations for settings forms and improved control semantics in model/prompt configuration.

## Deployment

1. Set environment variables in your host.
2. Run build:

```bash
npm run build
```

3. Start:

```bash
npm run start
```

For best SEO indexing, ensure your production domain serves:

- `/`
- `/sitemap.xml`
- `/robots.txt`
- `/opengraph-image`
- `/twitter-image`
