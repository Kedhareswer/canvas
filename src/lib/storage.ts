import fs from "fs/promises";
import path from "path";
import { DocumentMeta, LaTeXDocument } from "@/types/document";

const DOCS_DIR = path.join(process.cwd(), "documents");

async function ensureDir() {
  await fs.mkdir(DOCS_DIR, { recursive: true });
}

function texPath(id: string) {
  return path.join(DOCS_DIR, `${id}.tex`);
}

function metaPath(id: string) {
  return path.join(DOCS_DIR, `${id}.meta.json`);
}

export async function listDocuments(): Promise<DocumentMeta[]> {
  await ensureDir();
  const files = await fs.readdir(DOCS_DIR);
  const metaFiles = files.filter((f) => f.endsWith(".meta.json"));
  const metas: DocumentMeta[] = [];
  for (const f of metaFiles) {
    const raw = await fs.readFile(path.join(DOCS_DIR, f), "utf-8");
    metas.push(JSON.parse(raw));
  }
  metas.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  return metas;
}

export async function getDocument(id: string): Promise<LaTeXDocument | null> {
  try {
    const [source, rawMeta] = await Promise.all([
      fs.readFile(texPath(id), "utf-8"),
      fs.readFile(metaPath(id), "utf-8"),
    ]);
    return { id, source, meta: JSON.parse(rawMeta) };
  } catch {
    return null;
  }
}

export async function createDocument(
  id: string,
  title: string,
  source: string
): Promise<LaTeXDocument> {
  await ensureDir();
  const now = new Date().toISOString();
  const meta: DocumentMeta = {
    id,
    title,
    createdAt: now,
    updatedAt: now,
    sizeBytes: Buffer.byteLength(source, "utf-8"),
  };
  await Promise.all([
    fs.writeFile(texPath(id), source, "utf-8"),
    fs.writeFile(metaPath(id), JSON.stringify(meta, null, 2), "utf-8"),
  ]);
  return { id, source, meta };
}

export async function updateDocument(
  id: string,
  source: string,
  title?: string
): Promise<LaTeXDocument | null> {
  const existing = await getDocument(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const meta: DocumentMeta = {
    ...existing.meta,
    title: title ?? existing.meta.title,
    updatedAt: now,
    sizeBytes: Buffer.byteLength(source, "utf-8"),
  };
  await Promise.all([
    fs.writeFile(texPath(id), source, "utf-8"),
    fs.writeFile(metaPath(id), JSON.stringify(meta, null, 2), "utf-8"),
  ]);
  return { id, source, meta };
}

export async function deleteDocument(id: string): Promise<boolean> {
  try {
    await Promise.all([
      fs.unlink(texPath(id)),
      fs.unlink(metaPath(id)),
    ]);
    return true;
  } catch {
    return false;
  }
}
