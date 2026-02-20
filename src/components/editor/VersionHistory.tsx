"use client";

import { useDocumentStore } from "@/store/documentStore";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, History } from "lucide-react";

export function VersionHistory() {
  const { revisions, revisionIndex, undo, redo } = useDocumentStore();

  if (revisions.length <= 1) return null;

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <History className="h-3.5 w-3.5" />
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={undo} disabled={revisionIndex <= 0}>
        <ChevronLeft className="h-3 w-3" />
      </Button>
      <span>
        {revisionIndex + 1} / {revisions.length}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={redo}
        disabled={revisionIndex >= revisions.length - 1}
      >
        <ChevronRight className="h-3 w-3" />
      </Button>
    </div>
  );
}
