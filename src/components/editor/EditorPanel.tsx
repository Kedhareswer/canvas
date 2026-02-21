"use client";

import { useUIStore } from "@/store/uiStore";
import { EditorToolbar } from "./EditorToolbar";
import { LaTeXSourceEditor } from "./LaTeXSourceEditor";
import { LaTeXPreview } from "./LaTeXPreview";

export function EditorPanel() {
  const viewMode = useUIStore((s) => s.viewMode);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <EditorToolbar />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {(viewMode === "source" || viewMode === "split") && (
          <div className={viewMode === "split" ? "h-full min-h-0 w-1/2 border-r border-border" : "h-full min-h-0 w-full"}>
            <LaTeXSourceEditor />
          </div>
        )}
        {(viewMode === "preview" || viewMode === "split") && (
          <div className={viewMode === "split" ? "h-full min-h-0 w-1/2" : "h-full min-h-0 w-full"}>
            <LaTeXPreview />
          </div>
        )}
      </div>
    </div>
  );
}
