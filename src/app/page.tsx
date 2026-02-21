"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDocumentsStore, StoredDocument } from "@/store/documentsStore";
import {
  useSettingsStore,
  GeminiModel,
  GroqModel,
  LLMProvider,
  MODEL_DISPLAY_NAMES,
  MODEL_TAGS,
  GROQ_MODEL_DISPLAY_NAMES,
  GROQ_MODEL_TAGS,
  CitationStyle,
  DocumentClass,
} from "@/store/settingsStore";
import {
  Plus,
  Search,
  ArrowUpRight,
  Sparkles,
  FileText,
  Clock3,
  Settings,
  ChevronDown,
  Globe,
  RefreshCw,
  BookOpen,
  FileType,
  X,
  Check,
} from "lucide-react";
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

const GEMINI_MODEL_GROUPS: { label: string; models: GeminiModel[] }[] = [
  {
    label: "2.5 Series",
    models: ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro"],
  },
  {
    label: "3.x Series",
    models: [
      "gemini-3-flash-preview",
      "gemini-3-pro-preview",
      "gemini-3.1-pro-preview",
      "gemini-3-pro-image-preview",
    ],
  },
];

const GROQ_MODEL_GROUPS: { label: string; models: GroqModel[] }[] = [
  {
    label: "Llama",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "meta-llama/llama-4-scout-17b-16e-instruct"],
  },
  {
    label: "Others",
    models: ["qwen/qwen3-32b", "deepseek-r1-distill-llama-70b"],
  },
];

const CITATION_OPTIONS: { value: CitationStyle; label: string }[] = [
  { value: "ieee", label: "IEEE" },
  { value: "apa", label: "APA" },
  { value: "mla", label: "MLA" },
  { value: "chicago", label: "Chicago" },
  { value: "harvard", label: "Harvard" },
];

const DOC_CLASS_OPTIONS: { value: DocumentClass; label: string }[] = [
  { value: "article", label: "Article" },
  { value: "report", label: "Report" },
  { value: "book", label: "Book" },
  { value: "beamer", label: "Beamer" },
  { value: "letter", label: "Letter" },
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

/* ── Popover hook ─────────────────────────────────────── */
function usePopover() {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  function toggle() {
    if (!open && ref.current) {
      setRect(ref.current.getBoundingClientRect());
    }
    setOpen((v) => !v);
  }

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return { open, toggle, ref, rect };
}

/* ── Model Selector ───────────────────────────────────── */
function ModelSelector() {
  const { open, toggle, ref, rect } = usePopover();
  const quickModel = useSettingsStore((s) => s.quickModel);
  const quickProvider = useSettingsStore((s) => s.quickProvider);
  const setQuickModel = useSettingsStore((s) => s.setQuickModel);
  const setQuickProvider = useSettingsStore((s) => s.setQuickProvider);

  const displayName = quickProvider === "groq"
    ? GROQ_MODEL_DISPLAY_NAMES[quickModel as GroqModel] ?? quickModel
    : MODEL_DISPLAY_NAMES[quickModel as GeminiModel] ?? quickModel;

  const modelGroups = quickProvider === "groq" ? GROQ_MODEL_GROUPS : GEMINI_MODEL_GROUPS;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        className="inline-flex items-center gap-1.5 rounded-full border border-[#d3d9d3] bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-[#b0bab0] hover:bg-[#f5f7f5]"
      >
        <span className="text-[10px] font-bold uppercase text-slate-400 mr-0.5">{quickProvider === "groq" ? "Groq" : "Gemini"}</span>
        {displayName}
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && rect && (
        <div
          className="fixed z-50 w-72 overflow-hidden rounded-xl border border-[#d3d9d3] bg-white shadow-lg"
          style={{ top: rect.bottom + 8, right: window.innerWidth - rect.right }}
        >
          {/* Provider tabs */}
          <div className="flex border-b border-[#eef0ee]">
            {(["gemini", "groq"] as LLMProvider[]).map((p) => (
              <button
                key={p}
                onClick={() => {
                  if (p !== quickProvider) {
                    setQuickProvider(p);
                    setQuickModel(p === "groq" ? "llama-3.3-70b-versatile" : "gemini-2.5-flash");
                  }
                }}
                className={`flex-1 px-3 py-2 text-xs font-bold uppercase tracking-wider transition ${quickProvider === p
                    ? "bg-[#eef3ee] text-[#1c4f2d] border-b-2 border-[#1c4f2d]"
                    : "text-slate-400 hover:text-slate-600 hover:bg-[#f9faf9]"
                  }`}
              >
                {p === "gemini" ? "Gemini" : "Groq"}
              </button>
            ))}
          </div>

          {/* Model list */}
          {modelGroups.map((group) => (
            <div key={group.label}>
              <div className="border-b border-[#eef0ee] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {group.label}
              </div>
              {group.models.map((model) => {
                const active = model === quickModel;
                const name = quickProvider === "groq"
                  ? GROQ_MODEL_DISPLAY_NAMES[model as GroqModel] ?? model
                  : MODEL_DISPLAY_NAMES[model as GeminiModel] ?? model;
                const tag = quickProvider === "groq"
                  ? GROQ_MODEL_TAGS[model as GroqModel]
                  : MODEL_TAGS[model as GeminiModel];
                return (
                  <button
                    key={model}
                    onClick={() => {
                      setQuickModel(model);
                      toggle();
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-[#f3f5f3] ${active ? "bg-[#eef3ee] font-semibold text-[#1c4f2d]" : "text-slate-700"
                      }`}
                  >
                    <span className="flex items-center gap-2">
                      {active && <Check className="h-3.5 w-3.5 text-[#1c4f2d]" />}
                      {!active && <span className="h-3.5 w-3.5" />}
                      {name}
                    </span>
                    {tag && (
                      <span className="rounded-full bg-[#eef0ee] px-2 py-0.5 text-[10px] font-medium text-slate-500">
                        {tag}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Skills Popover ───────────────────────────────────── */
function SkillsPopover() {
  const { open, toggle, ref, rect } = usePopover();
  const skills = useSettingsStore((s) => s.landingSkills);
  const setSkills = useSettingsStore((s) => s.setLandingSkills);

  const activeCount =
    (skills.webResearch ? 1 : 0) +
    (skills.deepReview ? 1 : 0) +
    (skills.citationStyle ? 1 : 0) +
    (skills.documentClass ? 1 : 0);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-md border text-slate-500 transition hover:border-[#b0bab0] hover:bg-[#f5f7f5] ${activeCount > 0
            ? "border-[#6f8c75] bg-[#eef3ee] text-[#1c4f2d]"
            : "border-[#d3d8d3] bg-white"
          }`}
        aria-label="Add enhancements"
      >
        {activeCount > 0 ? (
          <span className="text-xs font-bold">{activeCount}</span>
        ) : (
          <Plus className="h-4 w-4" />
        )}
      </button>

      {open && rect && (
        <div
          className="fixed z-50 w-72 overflow-hidden rounded-xl border border-[#d3d9d3] bg-white shadow-lg"
          style={{ top: rect.bottom + 8, left: rect.left }}
        >
          <div className="border-b border-[#eef0ee] px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Enhancements
              </span>
              {activeCount > 0 && (
                <button
                  onClick={() => {
                    setSkills({
                      webResearch: false,
                      deepReview: false,
                      citationStyle: null,
                      documentClass: null,
                    });
                  }}
                  className="text-[10px] font-medium text-slate-400 transition hover:text-slate-600"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Toggle skills */}
          <div className="space-y-0.5 p-1.5">
            <button
              onClick={() => setSkills({ webResearch: !skills.webResearch })}
              className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition hover:bg-[#f3f5f3] ${skills.webResearch ? "bg-[#eef3ee]" : ""
                }`}
            >
              <Globe className={`h-4 w-4 shrink-0 ${skills.webResearch ? "text-[#1c4f2d]" : "text-slate-400"}`} />
              <span className="flex-1">
                <span className={`block text-sm font-medium ${skills.webResearch ? "text-[#1c4f2d]" : "text-slate-700"}`}>
                  Web Research
                </span>
                <span className="block text-[11px] leading-tight text-slate-400">
                  Search the web for real citations
                </span>
              </span>
              {skills.webResearch && <Check className="h-4 w-4 shrink-0 text-[#1c4f2d]" />}
            </button>

            <button
              onClick={() => setSkills({ deepReview: !skills.deepReview })}
              className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition hover:bg-[#f3f5f3] ${skills.deepReview ? "bg-[#eef3ee]" : ""
                }`}
            >
              <RefreshCw className={`h-4 w-4 shrink-0 ${skills.deepReview ? "text-[#1c4f2d]" : "text-slate-400"}`} />
              <span className="flex-1">
                <span className={`block text-sm font-medium ${skills.deepReview ? "text-[#1c4f2d]" : "text-slate-700"}`}>
                  Deep Review
                </span>
                <span className="block text-[11px] leading-tight text-slate-400">
                  4 revision passes for thorough editing
                </span>
              </span>
              {skills.deepReview && <Check className="h-4 w-4 shrink-0 text-[#1c4f2d]" />}
            </button>
          </div>

          {/* Citation style */}
          <div className="border-t border-[#eef0ee] p-2">
            <div className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Citation Style
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CITATION_OPTIONS.map((opt) => {
                const active = skills.citationStyle === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() =>
                      setSkills({
                        citationStyle: active ? null : opt.value,
                      })
                    }
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${active
                        ? "bg-[#1c4f2d] text-white"
                        : "bg-[#f0f2f0] text-slate-600 hover:bg-[#e4e8e4]"
                      }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Document class */}
          <div className="border-t border-[#eef0ee] p-2">
            <div className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Document Class
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DOC_CLASS_OPTIONS.map((opt) => {
                const active = skills.documentClass === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() =>
                      setSkills({
                        documentClass: active ? null : opt.value,
                      })
                    }
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${active
                        ? "bg-[#1c4f2d] text-white"
                        : "bg-[#f0f2f0] text-slate-600 hover:bg-[#e4e8e4]"
                      }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Active Skills Chips ──────────────────────────────── */
function SkillChips() {
  const skills = useSettingsStore((s) => s.landingSkills);
  const setSkills = useSettingsStore((s) => s.setLandingSkills);

  const chips: { key: string; label: string; icon: React.ReactNode; onRemove: () => void }[] = [];

  if (skills.webResearch) {
    chips.push({
      key: "web",
      label: "Web Research",
      icon: <Globe className="h-3 w-3" />,
      onRemove: () => setSkills({ webResearch: false }),
    });
  }
  if (skills.deepReview) {
    chips.push({
      key: "deep",
      label: "Deep Review",
      icon: <RefreshCw className="h-3 w-3" />,
      onRemove: () => setSkills({ deepReview: false }),
    });
  }
  if (skills.citationStyle) {
    chips.push({
      key: "cite",
      label: skills.citationStyle.toUpperCase(),
      icon: <BookOpen className="h-3 w-3" />,
      onRemove: () => setSkills({ citationStyle: null }),
    });
  }
  if (skills.documentClass) {
    chips.push({
      key: "class",
      label: skills.documentClass.charAt(0).toUpperCase() + skills.documentClass.slice(1),
      icon: <FileType className="h-3 w-3" />,
      onRemove: () => setSkills({ documentClass: null }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 rounded-full border border-[#c5d3c7] bg-[#eef3ee] px-2 py-0.5 text-[11px] font-medium text-[#1c4f2d]"
        >
          {chip.icon}
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            aria-label={`Remove ${chip.label}`}
            title={`Remove ${chip.label}`}
            className="ml-0.5 rounded-full p-0.5 transition hover:bg-[#d5e0d6]"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────── */
export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [instruction, setInstruction] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const createDocument = useDocumentsStore((s) => s.createDocument);
  const deleteDocument = useDocumentsStore((s) => s.deleteDocument);
  const listDocuments = useDocumentsStore((s) => s.listDocuments);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const documents: StoredDocument[] = isHydrated ? listDocuments() : [];

  const filteredDocs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter((doc) => doc.title.toLowerCase().includes(q));
  }, [documents, query]);

  function createAndOpenDocument(seed?: string, options?: { autorun?: boolean }) {
    if (isCreating) return;
    setIsCreating(true);

    const base = (seed ?? instruction).trim();
    const fallbackTitle = "Untitled Document";
    const title = base
      ? base.slice(0, 72).replace(/\s+/g, " ").trim()
      : fallbackTitle;

    const id = createDocument(title);
    if (options?.autorun && base) {
      const params = new URLSearchParams({
        autorun: "1",
        prompt: base,
      });
      router.push(`/editor/${id}?${params.toString()}`);
    } else {
      router.push(`/editor/${id}`);
    }
    setIsCreating(false);
  }

  function handleSubmit() {
    createAndOpenDocument(undefined, { autorun: true });
  }

  return (
    <div className={`${bodyFont.className} min-h-screen bg-[#eef0ee] text-slate-800`}>
      <div className="flex min-h-screen flex-col md:flex-row">
        <aside className="w-full border-b border-[#d6dad6] bg-[#f6f7f5] md:h-screen md:w-[300px] md:border-b-0 md:border-r">
          <div className="space-y-4 p-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => createAndOpenDocument()}
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
              {!isHydrated ? (
                <p className="px-1 py-6 text-sm text-slate-500">Loading documents...</p>
              ) : filteredDocs.length === 0 ? (
                <p className="px-1 py-6 text-sm text-slate-500">No matching drafts</p>
              ) : (
                filteredDocs.slice(0, 10).map((doc) => (
                  <div key={doc.id} className="group relative">
                    <button
                      onClick={() => router.push(`/editor/${doc.id}`)}
                      className="flex w-full items-start gap-2 rounded-md px-2 py-2 pr-8 text-left transition hover:bg-[#eaede9]"
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
                    <button
                      type="button"
                      onClick={() => deleteDocument(doc.id)}
                      aria-label={`Delete ${doc.title}`}
                      title="Delete draft"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 opacity-0 transition hover:bg-[#e3e8e3] hover:text-slate-700 group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#d6dad6] px-4 py-3 text-sm text-slate-700 md:absolute md:bottom-0 md:w-[300px]">
            <span className={`${displayFont.className} text-[30px] leading-none`}>LaTeX Labs</span>
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
              What will you write today?
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

                {/* Active skill chips */}
                {isHydrated ? <SkillChips /> : null}

                <div className="mt-3 flex items-center justify-between gap-3">
                  {isHydrated ? (
                    <SkillsPopover />
                  ) : (
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#d3d8d3] bg-white text-slate-300"
                      aria-label="Add enhancements"
                      disabled
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}

                  <div className="flex items-center gap-3">
                    {isHydrated ? (
                      <ModelSelector />
                    ) : (
                      <span className="rounded-full border border-[#d3d9d3] bg-white px-3 py-1 text-xs font-semibold text-slate-400">
                        Loading model...
                      </span>
                    )}
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
                      onClick={() => createAndOpenDocument(item.title)}
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
