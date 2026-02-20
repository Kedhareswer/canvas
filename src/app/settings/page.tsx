"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Key, FileText, Cpu } from "lucide-react";
import { ApiKeysTab } from "@/components/settings/ApiKeysTab";
import { AgentPromptsTab } from "@/components/settings/AgentPromptsTab";
import { ModelTab } from "@/components/settings/ModelTab";
import { cn } from "@/lib/utils";

type Tab = "api-keys" | "prompts" | "model";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "api-keys", label: "API Keys", icon: Key },
  { id: "prompts", label: "Agent Prompts", icon: FileText },
  { id: "model", label: "Model & Hops", icon: Cpu },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("api-keys");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 h-12 px-4 border-b border-border bg-background sticky top-0 z-10">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div className="w-px h-4 bg-border" />
        <span className="text-sm font-semibold">Settings</span>
      </header>

      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure API keys, customize agent prompts, and tune model behavior.
          </p>
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg mb-6">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors",
                activeTab === id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div>
          {activeTab === "api-keys" && <ApiKeysTab />}
          {activeTab === "prompts" && <AgentPromptsTab />}
          {activeTab === "model" && <ModelTab />}
        </div>
      </div>
    </div>
  );
}
