import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { generateId } from "@/lib/utils";

const IMAGES_DIR = path.join(process.cwd(), "documents", "images");

async function ensureDir() {
  await fs.mkdir(IMAGES_DIR, { recursive: true });
}

export async function POST(req: NextRequest) {
  await ensureDir();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const id = generateId();
  const ext = file.name.split(".").pop() || "png";
  const filename = `${id}.${ext}`;
  const filepath = path.join(IMAGES_DIR, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filepath, buffer);

  return NextResponse.json({
    id,
    url: `/api/images/${filename}`,
    filename,
  });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const filename = url.searchParams.get("file");

  if (!filename) {
    return NextResponse.json({ error: "No filename" }, { status: 400 });
  }

  // Prevent path traversal
  const safeName = path.basename(filename);
  const filepath = path.join(IMAGES_DIR, safeName);

  try {
    const data = await fs.readFile(filepath);
    const ext = safeName.split(".").pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      svg: "image/svg+xml",
      webp: "image/webp",
    };
    return new Response(data, {
      headers: { "Content-Type": contentTypes[ext || ""] || "application/octet-stream" },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
