import { NextRequest, NextResponse } from "next/server";
import { listDocuments, createDocument } from "@/lib/storage";
import { generateId } from "@/lib/utils";
import { ARTICLE_TEMPLATE } from "@/lib/latex/templates";

export async function GET() {
  const docs = await listDocuments();
  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const id = generateId();
  const title = body.title || "Untitled Document";
  const source = body.source || ARTICLE_TEMPLATE;
  const doc = await createDocument(id, title, source);
  return NextResponse.json(doc, { status: 201 });
}
