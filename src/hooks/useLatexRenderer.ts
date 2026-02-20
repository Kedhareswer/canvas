"use client";

import { useMemo } from "react";
import { parseLatex } from "@/lib/latex/parser";
import { renderAST } from "@/lib/latex/renderer";

export function useLatexRenderer(source: string) {
  const html = useMemo(() => {
    if (!source.trim()) return "";
    try {
      const ast = parseLatex(source);
      return renderAST(ast);
    } catch {
      return `<p class="latex-error">Failed to render LaTeX preview</p>`;
    }
  }, [source]);

  return html;
}
