"use client";

import { useCallback, useEffect, useRef } from "react";
import { useDocumentStore } from "@/store/documentStore";
import { useDocumentsStore } from "@/store/documentsStore";

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

  // Load document from client-side store
  useEffect(() => {
    setDocId(docId);

    const doc = useDocumentsStore.getState().getDocument(docId);
    if (doc) {
      setSource(doc.source);
      setTitle(doc.title);
      pushRevision();
      useDocumentStore.setState({ isDirty: false });
    }
  }, [docId, setDocId, setSource, setTitle, pushRevision]);

  // Auto-save with 2s debounce to localStorage
  useEffect(() => {
    if (!isDirty || isSaving) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      setIsSaving(true);
      useDocumentsStore.getState().updateDocument(docId, source, title);
      markSaved();
    }, 2000);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [isDirty, source, title, docId, isSaving, setIsSaving, markSaved]);

  const saveNow = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    setIsSaving(true);
    useDocumentsStore.getState().updateDocument(docId, source, title);
    markSaved();
  }, [docId, source, title, setIsSaving, markSaved]);

  return { saveNow };
}
