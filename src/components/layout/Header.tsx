"use client";

import Link from "next/link";
import { useDocumentStore } from "@/store/documentStore";
import { Button } from "@/components/ui/button";
import { FileDown, Save, Undo2, Redo2, Settings } from "lucide-react";

interface HeaderProps {
  onSave: () => void;
}

export function Header({ onSave }: HeaderProps) {
  const { title, setTitle, isDirty, isSaving, lastSavedAt, undo, redo, source, revisionIndex, revisions } =
    useDocumentStore();

  const handleExport = () => {
    const blob = new Blob([source], { type: "application/x-tex" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.tex`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <header className="flex items-center justify-between h-12 px-4 border-b border-border bg-background">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-1 text-lg font-semibold"
          aria-label="Go to home page"
          title="Go to home page"
        >
          <span className="text-primary">LaTeX</span>
          <span className="text-muted-foreground">Labs</span>
        </Link>
        <input
          className="bg-transparent border-none text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring rounded px-2 py-1 max-w-[300px]"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Document title..."
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {isSaving
            ? "Saving..."
            : isDirty
              ? "Unsaved changes"
              : lastSavedAt
                ? `Saved ${new Date(lastSavedAt).toLocaleTimeString()}`
                : ""}
        </span>

        <Button variant="ghost" size="icon" onClick={undo} disabled={revisionIndex <= 0} title="Undo">
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={redo} disabled={revisionIndex >= revisions.length - 1} title="Redo">
          <Redo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onSave} title="Save">
          <Save className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <FileDown className="h-4 w-4 mr-1" />
          Export .tex
        </Button>
        <Link href="/settings">
          <Button variant="ghost" size="icon" title="Settings">
            <Settings className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </header>
  );
}
