"use client";

import { useState } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Eye, EyeOff } from "lucide-react";

type ValidationStatus = "idle" | "validating" | "valid" | "invalid";

export function ApiKeysTab() {
  const { googleApiKey, exaApiKey, groqApiKey, setGoogleApiKey, setExaApiKey, setGroqApiKey } =
    useSettingsStore();

  const [localKeys, setLocalKeys] = useState({
    google: googleApiKey,
    exa: exaApiKey,
    groq: groqApiKey,
  });
  const [status, setStatus] = useState<ValidationStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [showKeys, setShowKeys] = useState({
    google: false,
    exa: false,
    groq: false,
  });

  const handleSave = async () => {
    setGoogleApiKey(localKeys.google);
    setExaApiKey(localKeys.exa);
    setGroqApiKey(localKeys.groq);
    setStatus("validating");
    setStatusMessage("");

    try {
      const res = await fetch("/api/settings/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleApiKey: localKeys.google,
          exaApiKey: localKeys.exa,
          groqApiKey: localKeys.groq,
        }),
      });
      const data = await res.json();
      if (data.valid) {
        setStatus("valid");
        setStatusMessage(data.message ?? "Keys validated successfully.");
      } else {
        setStatus("invalid");
        setStatusMessage(data.error ?? "Validation failed.");
      }
    } catch {
      setStatus("invalid");
      setStatusMessage("Could not reach validation endpoint.");
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        API keys are stored only in your browser (localStorage). They are sent to the server
        as request headers and never persisted server-side.
      </p>

      {/* Google API Key */}
      <div className="space-y-1.5">
        <label htmlFor="google-api-key" className="text-sm font-medium">Google API Key</label>
        <div className="relative">
          <input
            id="google-api-key"
            type={showKeys.google ? "text" : "password"}
            value={localKeys.google}
            onChange={(e) => {
              setLocalKeys((prev) => ({ ...prev, google: e.target.value }));
              setStatus("idle");
            }}
            className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 pr-10 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="AIzaSy..."
          />
          <button
            type="button"
            onClick={() => setShowKeys((prev) => ({ ...prev, google: !prev.google }))}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showKeys.google ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Required for all Gemini model calls. Get one at{" "}
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">
            aistudio.google.com
          </a>
        </p>
      </div>

      {/* Groq API Key */}
      <div className="space-y-1.5">
        <label htmlFor="groq-api-key" className="text-sm font-medium">Groq API Key <span className="text-muted-foreground font-normal">(optional)</span></label>
        <div className="relative">
          <input
            id="groq-api-key"
            type={showKeys.groq ? "text" : "password"}
            value={localKeys.groq}
            onChange={(e) => {
              setLocalKeys((prev) => ({ ...prev, groq: e.target.value }));
              setStatus("idle");
            }}
            className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 pr-10 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="gsk_..."
          />
          <button
            type="button"
            onClick={() => setShowKeys((prev) => ({ ...prev, groq: !prev.groq }))}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showKeys.groq ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Required for Groq models (Llama, Qwen, DeepSeek). Get one at{" "}
          <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="underline">
            console.groq.com
          </a>
        </p>
      </div>

      {/* Exa API Key */}
      <div className="space-y-1.5">
        <label htmlFor="exa-api-key" className="text-sm font-medium">Exa API Key <span className="text-muted-foreground font-normal">(optional)</span></label>
        <div className="relative">
          <input
            id="exa-api-key"
            type={showKeys.exa ? "text" : "password"}
            value={localKeys.exa}
            onChange={(e) => {
              setLocalKeys((prev) => ({ ...prev, exa: e.target.value }));
              setStatus("idle");
            }}
            className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 pr-10 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="exa-..."
          />
          <button
            type="button"
            onClick={() => setShowKeys((prev) => ({ ...prev, exa: !prev.exa }))}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showKeys.exa ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Used by the Research agent for real web search. Get one at{" "}
          <a href="https://exa.ai" target="_blank" rel="noopener noreferrer" className="underline">exa.ai</a>
        </p>
      </div>

      {/* Status */}
      {status !== "idle" && (
        <div
          className={`flex items-start gap-2 rounded-md px-3 py-2.5 text-sm border ${
            status === "valid"
              ? "bg-green-50 text-green-700 border-green-200"
              : status === "invalid"
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-muted text-muted-foreground border-border"
          }`}
        >
          {status === "validating" && <Loader2 className="h-4 w-4 mt-0.5 animate-spin shrink-0" />}
          {status === "valid" && <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />}
          {status === "invalid" && <XCircle className="h-4 w-4 mt-0.5 shrink-0" />}
          <span>{status === "validating" ? "Validating keys..." : statusMessage}</span>
        </div>
      )}

      <Button onClick={handleSave} disabled={status === "validating"} className="w-full">
        {status === "validating" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Save & Validate
      </Button>
    </div>
  );
}
