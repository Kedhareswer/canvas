"use client";

import { useUIStore } from "@/store/uiStore";
import { Button } from "@/components/ui/button";
import { Code2, Eye, Columns2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function EditorToolbar() {
  const { viewMode, setViewMode } = useUIStore();

  const modes = [
    { value: "source" as const, icon: Code2, label: "Source" },
    { value: "split" as const, icon: Columns2, label: "Split" },
    { value: "preview" as const, icon: Eye, label: "Preview" },
  ];

  return (
    <div className="flex items-center justify-between px-3 py-1.5 border-b border-border">
      <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
        {modes.map(({ value, icon: Icon, label }) => (
          <Button
            key={value}
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 px-2.5 text-xs gap-1",
              viewMode === value && "bg-background shadow-sm"
            )}
            onClick={() => setViewMode(value)}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
