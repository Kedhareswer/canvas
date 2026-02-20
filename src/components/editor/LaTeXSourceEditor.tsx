"use client";

import { useEffect, useRef, useCallback } from "react";
import { useDocumentStore } from "@/store/documentStore";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { StreamLanguage } from "@codemirror/language";
import { stex } from "@codemirror/legacy-modes/mode/stex";
import { oneDark } from "@codemirror/theme-one-dark";

export function LaTeXSourceEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const { source, setSource } = useDocumentStore();
  const isExternalUpdate = useRef(false);

  const onUpdate = useCallback(
    (update: { docChanged: boolean; state: EditorState }) => {
      if (update.docChanged && !isExternalUpdate.current) {
        setSource(update.state.doc.toString());
      }
    },
    [setSource]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: source,
      extensions: [
        basicSetup,
        StreamLanguage.define(stex),
        oneDark,
        EditorView.updateListener.of(onUpdate),
        EditorView.theme({
          "&": { height: "100%", fontSize: "13px" },
          ".cm-scroller": { overflow: "auto", fontFamily: "'JetBrains Mono', Consolas, monospace" },
          ".cm-content": { padding: "8px 0" },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Only create editor once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external source changes into CodeMirror
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentDoc = view.state.doc.toString();
    if (currentDoc !== source) {
      isExternalUpdate.current = true;
      view.dispatch({
        changes: {
          from: 0,
          to: currentDoc.length,
          insert: source,
        },
      });
      isExternalUpdate.current = false;
    }
  }, [source]);

  return <div ref={containerRef} className="h-full overflow-hidden" />;
}
