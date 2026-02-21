"use client";

import { useDocumentStore } from "@/store/documentStore";
import { useLatexRenderer } from "@/hooks/useLatexRenderer";

export function LaTeXPreview() {
  const source = useDocumentStore((s) => s.source);
  const html = useLatexRenderer(source);

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
        <div
          className="latex-document"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
