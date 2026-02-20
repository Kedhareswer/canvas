"use client";

import { useCallback, useEffect, useRef } from "react";
import { useDocumentStore } from "@/store/documentStore";

export function useLatexDocument(docId: string) {
  const {
    source,
    title,
    isDirty,
    isSaving,
    setDocId,
    setSource,
    setTitle,
    pushRevision,
    markSaved,
    setIsSaving,
  } = useDocumentStore();

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load document
  useEffect(() => {
    setDocId(docId);

    async function load() {
      try {
        const res = await fetch(`/api/documents/${docId}`);
        if (res.ok) {
          const doc = await res.json();
          setSource(doc.source);
          setTitle(doc.meta.title);
          pushRevision();
          // Mark as not dirty since we just loaded
          useDocumentStore.setState({ isDirty: false });
        }
      } catch (err) {
        console.error("Failed to load document:", err);
      }
    }

    load();
  }, [docId, setDocId, setSource, setTitle, pushRevision]);

  // Auto-save with 2s debounce
  useEffect(() => {
    if (!isDirty || isSaving) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        await fetch(`/api/documents/${docId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source, title }),
        });
        markSaved();
      } catch (err) {
        console.error("Failed to save:", err);
        setIsSaving(false);
      }
    }, 2000);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [isDirty, source, title, docId, isSaving, setIsSaving, markSaved]);

  const saveNow = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    setIsSaving(true);
    try {
      await fetch(`/api/documents/${docId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, title }),
      });
      markSaved();
    } catch (err) {
      console.error("Failed to save:", err);
      setIsSaving(false);
    }
  }, [docId, source, title, setIsSaving, markSaved]);

  return { saveNow };
}
