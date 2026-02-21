import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 } from "uuid";
import { ARTICLE_TEMPLATE } from "@/lib/latex/templates";

export interface StoredDocument {
  id: string;
  source: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface DocumentsState {
  documents: Record<string, StoredDocument>;
  createDocument: (title: string, source?: string) => string;
  getDocument: (id: string) => StoredDocument | undefined;
  updateDocument: (id: string, source: string, title?: string) => void;
  deleteDocument: (id: string) => void;
  listDocuments: () => StoredDocument[];
}

export const useDocumentsStore = create<DocumentsState>()(
  persist(
    (set, get) => ({
      documents: {},

      createDocument: (title: string, source?: string) => {
        const id = v4();
        const now = new Date().toISOString();
        const doc: StoredDocument = {
          id,
          source: source ?? ARTICLE_TEMPLATE,
          title,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          documents: { ...state.documents, [id]: doc },
        }));
        return id;
      },

      getDocument: (id: string) => {
        return get().documents[id];
      },

      updateDocument: (id: string, source: string, title?: string) => {
        const existing = get().documents[id];
        if (!existing) return;
        set((state) => ({
          documents: {
            ...state.documents,
            [id]: {
              ...existing,
              source,
              title: title ?? existing.title,
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      deleteDocument: (id: string) => {
        set((state) => {
          const { [id]: _, ...rest } = state.documents;
          return { documents: rest };
        });
      },

      listDocuments: () => {
        const docs = Object.values(get().documents);
        return docs.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      },
    }),
    {
      name: "latex-editor-documents",
    }
  )
);
