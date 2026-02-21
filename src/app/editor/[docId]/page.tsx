"use client";

import { use, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { AppShell } from "@/components/layout/AppShell";
import { useLatexDocument } from "@/hooks/useLatexDocument";
import { useAgentStream } from "@/hooks/useAgentStream";
import { useDocumentStore } from "@/store/documentStore";
import { useUIStore } from "@/store/uiStore";
import { useChatStore } from "@/store/chatStore";

function EditorContent({ docId }: { docId: string }) {
  const { saveNow } = useLatexDocument(docId);
  const { sendMessage } = useAgentStream();
  const router = useRouter();
  const searchParams = useSearchParams();
  const source = useDocumentStore((s) => s.source);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const autoRunTriggeredRef = useRef(false);

  const autoRunPrompt = useMemo(
    () => (searchParams.get("prompt") ?? "").trim(),
    [searchParams]
  );
  const shouldAutoRun = searchParams.get("autorun") === "1";

  useEffect(() => {
    if (!shouldAutoRun || !autoRunPrompt || autoRunTriggeredRef.current || isStreaming) {
      return;
    }

    autoRunTriggeredRef.current = true;
    const forcedAgents = useUIStore.getState().forcedAgents;
    sendMessage(autoRunPrompt, source, forcedAgents.length > 0 ? forcedAgents : []);
    router.replace(`/editor/${docId}`);
  }, [shouldAutoRun, autoRunPrompt, isStreaming, sendMessage, source, router, docId]);

  useEffect(() => {
    document.body.classList.add("editor-route");
    document.documentElement.classList.add("editor-route");

    return () => {
      document.body.classList.remove("editor-route");
      document.documentElement.classList.remove("editor-route");
    };
  }, []);

  return (
    <div className="flex h-screen min-h-screen min-w-0 flex-col overflow-hidden">
      <Header onSave={saveNow} />
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
        <AppShell />
      </div>
    </div>
  );
}

export default function EditorPage({
  params,
}: {
  params: Promise<{ docId: string }>;
}) {
  const { docId } = use(params);
  return <EditorContent docId={docId} />;
}
