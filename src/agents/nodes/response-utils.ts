type JsonRecord = Record<string, unknown>;

function collectText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((item) => collectText(item)).filter(Boolean).join("\n");
  }
  if (!content || typeof content !== "object") return "";

  const record = content as JsonRecord;
  if (typeof record.text === "string") return record.text;
  if (typeof record.output_text === "string") return record.output_text;
  if (typeof record.content === "string") return record.content;
  if (Array.isArray(record.content)) return collectText(record.content);

  return "";
}

export function getModelResponseText(content: unknown): string {
  const text = collectText(content).trim();
  if (text.length > 0) return text;
  try {
    return JSON.stringify(content);
  } catch {
    return "";
  }
}

export function stripCodeFences(text: string): string {
  return text
    .replace(/^```(?:json|latex|tex)?\s*/gim, "")
    .replace(/\s*```$/gim, "")
    .trim();
}

function extractBalancedJson(text: string, startIndex: number): string | null {
  const opener = text[startIndex];
  const closer = opener === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = startIndex; i < text.length; i += 1) {
    const char = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }
    if (char === opener) depth += 1;
    if (char === closer) depth -= 1;
    if (depth === 0) return text.slice(startIndex, i + 1);
  }

  return null;
}

export function parseJsonFromText(text: string): unknown {
  const cleaned = stripCodeFences(text);
  if (!cleaned) {
    throw new Error("Empty response");
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    // Fall through to balanced extraction for mixed prose + JSON outputs.
  }

  for (let i = 0; i < cleaned.length; i += 1) {
    const char = cleaned[i];
    if (char !== "{" && char !== "[") continue;
    const candidate = extractBalancedJson(cleaned, i);
    if (!candidate) continue;
    try {
      return JSON.parse(candidate);
    } catch {
      // continue scanning
    }
  }

  throw new Error("Invalid JSON");
}

