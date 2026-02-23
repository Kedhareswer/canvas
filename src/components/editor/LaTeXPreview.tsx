"use client";

import { useEffect, useRef } from "react";
import { useDocumentStore } from "@/store/documentStore";
import { useLatexRenderer } from "@/hooks/useLatexRenderer";

export function LaTeXPreview() {
  const source = useDocumentStore((s) => s.source);
  const html = useLatexRenderer(source);
  const htmlContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!htmlContainerRef.current) return;
    htmlContainerRef.current.innerHTML = html;
  }, [html]);

  if (!source.trim()) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Start typing LaTeX to see a preview
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8 pb-16">
        <div ref={htmlContainerRef} className="latex-document" />
      </div>
    </div>
  );
}
