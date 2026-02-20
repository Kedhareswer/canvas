"use client";

import { useUIStore } from "@/store/uiStore";
import { EditorToolbar } from "./EditorToolbar";
import { LaTeXSourceEditor } from "./LaTeXSourceEditor";
import { LaTeXPreview } from "./LaTeXPreview";

export function EditorPanel() {
  const viewMode = useUIStore((s) => s.viewMode);

  return (
    <div className="flex flex-col h-full bg-background">
      <EditorToolbar />
      <div className="flex-1 overflow-hidden flex">
        {(viewMode === "source" || viewMode === "split") && (
          <div className={viewMode === "split" ? "w-1/2 border-r border-border" : "w-full"}>
            <LaTeXSourceEditor />
          </div>
        )}
        {(viewMode === "preview" || viewMode === "split") && (
          <div className={viewMode === "split" ? "w-1/2" : "w-full"}>
            <LaTeXPreview />
          </div>
        )}
      </div>
    </div>
  );
}
