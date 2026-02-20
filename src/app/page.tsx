"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DocumentMeta } from "@/types/document";
import { Plus, Search, ArrowUpRight, Sparkles, FileText, Clock3, Settings } from "lucide-react";
import { Cormorant_Garamond, Manrope } from "next/font/google";

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["600", "700"],
});

const bodyFont = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const EXAMPLE_PROMPTS = [
  {
    title: "Literature Review Starter",
    description: "Summarize 8 core papers and generate citation-ready sections for related work.",
  },
  {
    title: "Method Section Draft",
    description: "Draft a reproducible methods section with equations, assumptions, and notation.",
  },
  {
    title: "Results Narrative",
    description: "Turn experiment outputs into structured analysis paragraphs with figure callouts.",
  },
  {
    title: "Citation Audit",
    description: "Check unsupported claims and add sources for every critical assertion in the draft.",
  },
  {
    title: "Academic Rewriter",
    description: "Refine tone to publication style while preserving technical correctness and meaning.",
  },
  {
    title: "Submission Checklist",
    description: "Run formatting, bibliography, and consistency checks before final submission.",
  },
];

function formatRelativeDate(value: string) {
  const date = new Date(value).getTime();
  if (!Number.isFinite(date)) return "Recently";
  const diffHours = Math.floor((Date.now() - date) / (1000 * 60 * 60));
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function HomePage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [query, setQuery] = useState("");
  const [instruction, setInstruction] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  async function fetchDocs() {
    try {
      const res = await fetch("/api/documents");
      if (res.ok) {
        setDocuments(await res.json());
      }
    } finally {
      setLoadingDocs(false);
    }
  }

  useEffect(() => {
    fetchDocs();
  }, []);

  const filteredDocs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter((doc) => doc.title.toLowerCase().includes(q));
  }, [documents, query]);

  async function createAndOpenDocument(seed?: string) {
    if (isCreating) return;
    setIsCreating(true);

    const base = (seed ?? instruction).trim();
    const fallbackTitle = "Untitled Document";
    const title = base
      ? base.slice(0, 72).replace(/\s+/g, " ").trim()
      : fallbackTitle;

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      if (!res.ok) return;
      const doc = await res.json();
      router.push(`/editor/${doc.id}`);
    } finally {
      setIsCreating(false);
    }
  }

  function handleSubmit() {
    void createAndOpenDocument();
  }

  return (
    <div className={`${bodyFont.className} min-h-screen bg-[#eef0ee] text-slate-800`}>
      <div className="flex min-h-screen flex-col md:flex-row">
        <aside className="w-full border-b border-[#d6dad6] bg-[#f6f7f5] md:h-screen md:w-[300px] md:border-b-0 md:border-r">
          <div className="space-y-4 p-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => void createAndOpenDocument()}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-[#1c4f2d] px-3 text-sm font-semibold text-white transition hover:bg-[#184327] disabled:opacity-60"
                disabled={isCreating}
              >
                <Plus className="h-4 w-4" />
                {isCreating ? "Creating..." : "New Draft"}
              </button>
              <button
                aria-label="Search documents"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#d3d7d3] bg-white text-slate-600"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>

            <div className="relative">
              <label htmlFor="doc-search" className="sr-only">
                Search documents
              </label>
              <input
                id="doc-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search drafts..."
                className="h-10 w-full rounded-md border border-[#d5d9d5] bg-white px-3 text-sm outline-none transition focus:border-[#6f8c75]"
              />
            </div>

            <div className="space-y-1.5">
              {loadingDocs ? (
                <p className="px-1 py-6 text-sm text-slate-500">Loading documents...</p>
              ) : filteredDocs.length === 0 ? (
                <p className="px-1 py-6 text-sm text-slate-500">No matching drafts</p>
              ) : (
                filteredDocs.slice(0, 10).map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => router.push(`/editor/${doc.id}`)}
                    className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition hover:bg-[#eaede9]"
                  >
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{doc.title}</span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock3 className="h-3 w-3" />
                        {formatRelativeDate(doc.updatedAt)}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#d6dad6] px-4 py-3 text-sm text-slate-700 md:absolute md:bottom-0 md:w-[300px]">
            <span className={`${displayFont.className} text-[30px] leading-none`}>Canvas</span>
            <button
              aria-label="Settings"
              onClick={() => router.push("/settings")}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-[#e9ece8]"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </aside>

        <main className="flex flex-1 items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-3xl">
            <h1 className={`${displayFont.className} mb-5 text-center text-4xl leading-tight text-slate-800 md:text-6xl`}>
              What will you publish today?
            </h1>

            <p className="mx-auto mb-8 max-w-2xl text-center text-sm text-slate-600 md:text-base">
              Launch a new LaTeX draft with your AI writing team: writer, reviewer, formatter, and web research.
            </p>

            <section className="overflow-hidden rounded-[26px] border border-[#d8ddd8] bg-[#f8f9f7] shadow-[0_18px_40px_-26px_rgba(11,30,17,0.45)]">
              <div className="border-b border-[#dde2dd] p-5">
                <label htmlFor="landing-task" className="sr-only">
                  Describe your document task
                </label>
                <textarea
                  id="landing-task"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  rows={3}
                  placeholder="Describe your paper goal, and we will scaffold the draft structure and launch the editor."
                  className="w-full resize-none rounded-xl border border-[#d7dcd7] bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#6f8c75]"
                />

                <div className="mt-3 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#d3d8d3] bg-white text-slate-500"
                    aria-label="Add attachment"
                  >
                    <Plus className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-3">
                    <span className="rounded-full border border-[#d3d9d3] bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      Gemini 2.5 / 3.0
                    </span>
                    <button
                      onClick={handleSubmit}
                      disabled={isCreating}
                      className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#8ca091] px-3 text-sm font-semibold text-white transition hover:bg-[#7f9384] disabled:opacity-70"
                    >
                      Start
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-700">Example prompts</h2>
                  <Sparkles className="h-4 w-4 text-[#6d866f]" />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {EXAMPLE_PROMPTS.map((item) => (
                    <button
                      key={item.title}
                      onClick={() => void createAndOpenDocument(item.title)}
                      className="rounded-xl border border-[#d8ddd8] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#bcc8bd] hover:shadow-sm"
                    >
                      <h3 className="mb-1.5 text-sm font-semibold text-slate-800">{item.title}</h3>
                      <p className="text-xs leading-relaxed text-slate-600">{item.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
