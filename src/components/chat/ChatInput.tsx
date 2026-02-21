"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Square, Plus, Globe, RefreshCw, BookOpen, FileType, X, Check } from "lucide-react";
import {
  useSettingsStore,
  CitationStyle,
  DocumentClass,
} from "@/store/settingsStore";

interface ChatInputProps {
  onSend: (message: string) => void;
  onAbort: () => void;
  isStreaming: boolean;
}

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

export function ChatInput({ onSend, onAbort, isStreaming }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [enhancementsOpen, setEnhancementsOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const enhancementsRef = useRef<HTMLDivElement>(null);
  const skills = useSettingsStore((s) => s.landingSkills);
  const setSkills = useSettingsStore((s) => s.setLandingSkills);

  const activeCount =
    (skills.webResearch ? 1 : 0) +
    (skills.deepReview ? 1 : 0) +
    (skills.citationStyle ? 1 : 0) +
    (skills.documentClass ? 1 : 0);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, isStreaming, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 150) + "px";
  };

  useEffect(() => {
    if (!enhancementsOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (enhancementsRef.current && !enhancementsRef.current.contains(e.target as Node)) {
        setEnhancementsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [enhancementsOpen]);

  return (
    <div className="p-3 border-t border-border">
      {activeCount > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {skills.webResearch && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#c5d3c7] bg-[#eef3ee] px-2 py-0.5 text-[11px] font-medium text-[#1c4f2d]">
              <Globe className="h-3 w-3" />
              Web Research
              <button
                type="button"
                onClick={() => setSkills({ webResearch: false })}
                aria-label="Remove Web Research"
                title="Remove Web Research"
                className="ml-0.5 rounded-full p-0.5 transition hover:bg-[#d5e0d6]"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          )}
          {skills.deepReview && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#c5d3c7] bg-[#eef3ee] px-2 py-0.5 text-[11px] font-medium text-[#1c4f2d]">
              <RefreshCw className="h-3 w-3" />
              Deep Review
              <button
                type="button"
                onClick={() => setSkills({ deepReview: false })}
                aria-label="Remove Deep Review"
                title="Remove Deep Review"
                className="ml-0.5 rounded-full p-0.5 transition hover:bg-[#d5e0d6]"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          )}
          {skills.citationStyle && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#c5d3c7] bg-[#eef3ee] px-2 py-0.5 text-[11px] font-medium text-[#1c4f2d]">
              <BookOpen className="h-3 w-3" />
              {skills.citationStyle.toUpperCase()}
              <button
                type="button"
                onClick={() => setSkills({ citationStyle: null })}
                aria-label={`Remove ${skills.citationStyle.toUpperCase()} citation style`}
                title={`Remove ${skills.citationStyle.toUpperCase()} citation style`}
                className="ml-0.5 rounded-full p-0.5 transition hover:bg-[#d5e0d6]"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          )}
          {skills.documentClass && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#c5d3c7] bg-[#eef3ee] px-2 py-0.5 text-[11px] font-medium text-[#1c4f2d]">
              <FileType className="h-3 w-3" />
              {skills.documentClass.charAt(0).toUpperCase() + skills.documentClass.slice(1)}
              <button
                type="button"
                onClick={() => setSkills({ documentClass: null })}
                aria-label={`Remove ${skills.documentClass} document class`}
                title={`Remove ${skills.documentClass} document class`}
                className="ml-0.5 rounded-full p-0.5 transition hover:bg-[#d5e0d6]"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          )}
        </div>
      )}
      <div className="flex items-end gap-2">
        <div ref={enhancementsRef} className="relative">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setEnhancementsOpen((v) => !v)}
            aria-label="Enhancements"
            title="Enhancements"
            className={activeCount > 0 ? "border-[#6f8c75] bg-[#eef3ee] text-[#1c4f2d]" : ""}
          >
            {activeCount > 0 ? (
              <span className="text-xs font-bold">{activeCount}</span>
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>

          {enhancementsOpen && (
            <div className="absolute bottom-full left-0 z-50 mb-2 w-72 overflow-hidden rounded-xl border border-[#d3d9d3] bg-white shadow-lg">
              <div className="border-b border-[#eef0ee] px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Enhancements</span>
                  {activeCount > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setSkills({
                          webResearch: false,
                          deepReview: false,
                          citationStyle: null,
                          documentClass: null,
                        })
                      }
                      className="text-[10px] font-medium text-slate-400 transition hover:text-slate-600"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-0.5 p-1.5">
                <button
                  type="button"
                  onClick={() => setSkills({ webResearch: !skills.webResearch })}
                  className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition hover:bg-[#f3f5f3] ${skills.webResearch ? "bg-[#eef3ee]" : ""}`}
                >
                  <Globe className={`h-4 w-4 shrink-0 ${skills.webResearch ? "text-[#1c4f2d]" : "text-slate-400"}`} />
                  <span className="flex-1">
                    <span className={`block text-sm font-medium ${skills.webResearch ? "text-[#1c4f2d]" : "text-slate-700"}`}>Web Research</span>
                    <span className="block text-[11px] leading-tight text-slate-400">Search the web for real citations</span>
                  </span>
                  {skills.webResearch && <Check className="h-4 w-4 shrink-0 text-[#1c4f2d]" />}
                </button>

                <button
                  type="button"
                  onClick={() => setSkills({ deepReview: !skills.deepReview })}
                  className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition hover:bg-[#f3f5f3] ${skills.deepReview ? "bg-[#eef3ee]" : ""}`}
                >
                  <RefreshCw className={`h-4 w-4 shrink-0 ${skills.deepReview ? "text-[#1c4f2d]" : "text-slate-400"}`} />
                  <span className="flex-1">
                    <span className={`block text-sm font-medium ${skills.deepReview ? "text-[#1c4f2d]" : "text-slate-700"}`}>Deep Review</span>
                    <span className="block text-[11px] leading-tight text-slate-400">4 revision passes for thorough editing</span>
                  </span>
                  {skills.deepReview && <Check className="h-4 w-4 shrink-0 text-[#1c4f2d]" />}
                </button>
              </div>

              <div className="border-t border-[#eef0ee] p-2">
                <div className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Citation Style</div>
                <div className="flex flex-wrap gap-1.5">
                  {CITATION_OPTIONS.map((opt) => {
                    const active = skills.citationStyle === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSkills({ citationStyle: active ? null : opt.value })}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${active ? "bg-[#1c4f2d] text-white" : "bg-[#f0f2f0] text-slate-600 hover:bg-[#e4e8e4]"}`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-[#eef0ee] p-2">
                <div className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Document Class</div>
                <div className="flex flex-wrap gap-1.5">
                  {DOC_CLASS_OPTIONS.map((opt) => {
                    const active = skills.documentClass === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSkills({ documentClass: active ? null : opt.value })}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${active ? "bg-[#1c4f2d] text-white" : "bg-[#f0f2f0] text-slate-600 hover:bg-[#e4e8e4]"}`}
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

        <textarea
          ref={textareaRef}
          className="flex-1 resize-none bg-muted/50 border border-input rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring min-h-[40px] max-h-[150px]"
          placeholder="Ask AI to write, review, format..."
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isStreaming}
        />
        {isStreaming ? (
          <Button variant="destructive" size="icon" onClick={onAbort} aria-label="Stop generation" title="Stop generation">
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="icon" onClick={handleSend} disabled={!value.trim()} aria-label="Send message" title="Send message">
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
