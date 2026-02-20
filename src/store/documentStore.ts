import { create } from "zustand";
import { RevisionEntry } from "@/types/document";

interface DocumentState {
  docId: string | null;
  title: string;
  source: string;
  revisions: RevisionEntry[];
  revisionIndex: number;
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: string | null;

  setDocId: (id: string | null) => void;
  setTitle: (title: string) => void;
  setSource: (source: string) => void;
  pushRevision: (agentName?: string) => void;
  undo: () => void;
  redo: () => void;
  markSaved: () => void;
  setIsSaving: (saving: boolean) => void;
  reset: () => void;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  docId: null,
  title: "Untitled Document",
  source: "",
  revisions: [],
  revisionIndex: -1,
  isDirty: false,
  isSaving: false,
  lastSavedAt: null,

  setDocId: (id) => set({ docId: id }),

  setTitle: (title) => set({ title, isDirty: true }),

  setSource: (source) => set({ source, isDirty: true }),

  pushRevision: (agentName) => {
    const { source, revisions, revisionIndex } = get();
    const entry: RevisionEntry = {
      timestamp: new Date().toISOString(),
      source,
      agentName,
    };
    // Truncate any future revisions if we're not at the end
    const newRevisions = revisions.slice(0, revisionIndex + 1);
    newRevisions.push(entry);
    // Keep max 50 revisions
    if (newRevisions.length > 50) newRevisions.shift();
    set({
      revisions: newRevisions,
      revisionIndex: newRevisions.length - 1,
    });
  },

  undo: () => {
    const { revisions, revisionIndex } = get();
    if (revisionIndex > 0) {
      const newIndex = revisionIndex - 1;
      set({
        source: revisions[newIndex].source,
        revisionIndex: newIndex,
        isDirty: true,
      });
    }
  },

  redo: () => {
    const { revisions, revisionIndex } = get();
    if (revisionIndex < revisions.length - 1) {
      const newIndex = revisionIndex + 1;
      set({
        source: revisions[newIndex].source,
        revisionIndex: newIndex,
        isDirty: true,
      });
    }
  },

  markSaved: () =>
    set({ isDirty: false, isSaving: false, lastSavedAt: new Date().toISOString() }),

  setIsSaving: (saving) => set({ isSaving: saving }),

  reset: () =>
    set({
      docId: null,
      title: "Untitled Document",
      source: "",
      revisions: [],
      revisionIndex: -1,
      isDirty: false,
      isSaving: false,
      lastSavedAt: null,
    }),
}));
