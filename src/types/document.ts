export interface DocumentMeta {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  sizeBytes: number;
}

export interface LaTeXDocument {
  id: string;
  meta: DocumentMeta;
  source: string;
}

export interface RevisionEntry {
  timestamp: string;
  source: string;
  agentName?: string;
}
