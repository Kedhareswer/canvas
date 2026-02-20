"use client";

import { use } from "react";
import { Header } from "@/components/layout/Header";
import { AppShell } from "@/components/layout/AppShell";
import { useLatexDocument } from "@/hooks/useLatexDocument";

function EditorContent({ docId }: { docId: string }) {
  const { saveNow } = useLatexDocument(docId);

  return (
    <div className="flex flex-col h-screen">
      <Header onSave={saveNow} />
      <AppShell />
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
