export interface ListItem {
  content: ASTNode[];
  nestedList?: ASTNode;
}

export type ASTNode =
  | { type: "text"; content: string }
  | { type: "section"; level: number; title: string }
  | { type: "math-inline"; content: string }
  | { type: "math-display"; content: string }
  | { type: "table"; content: string }
  | { type: "figure"; src: string; caption: string; label: string }
  | { type: "list"; ordered: boolean; items: ListItem[] }
  | { type: "description-list"; items: { term: string; description: ASTNode[] }[] }
  | { type: "bibliography"; items: { key: string; text: string }[] }
  | { type: "title"; title: string; author: string; date: string }
  | { type: "abstract"; content: string }
  | { type: "raw"; content: string }
  | { type: "bold"; content: string }
  | { type: "italic"; content: string }
  | { type: "code"; content: string }
  | { type: "href"; url: string; text: string }
  | { type: "color"; color: string; content: string }
  | { type: "cite"; keys: string[] }
  | { type: "footnote"; content: string };

/* ── Brace-depth utilities ─────────────────────────── */

/** Find the matching closing brace, handling nested braces. Returns content inside braces and chars consumed (including the braces). */
function matchBracedArg(input: string): { content: string; length: number } | null {
  if (input[0] !== "{") return null;
  let depth = 0;
  for (let i = 0; i < input.length; i++) {
    if (input[i] === "{") depth++;
    else if (input[i] === "}") {
      depth--;
      if (depth === 0) return { content: input.slice(1, i), length: i + 1 };
    }
  }
  return null;
}

/** Find matching \end{envName} handling nested \begin/\end of any environment. Returns content inside and total consumed length including \begin{} and \end{}. */
function matchEnvironment(input: string, envName: string): { content: string; length: number } | null {
  const openTag = `\\begin{${envName}}`;
  if (!input.startsWith(openTag)) return null;

  let depth = 0;
  let i = 0;
  while (i < input.length) {
    if (input.startsWith("\\begin{", i)) {
      depth++;
      const endBrace = input.indexOf("}", i + 7);
      i = endBrace !== -1 ? endBrace + 1 : i + 7;
    } else if (input.startsWith("\\end{", i)) {
      const endBrace = input.indexOf("}", i + 5);
      const closeName = endBrace !== -1 ? input.slice(i + 5, endBrace) : "";
      depth--;
      if (depth === 0 && closeName === envName) {
        const totalLen = endBrace + 1;
        const contentStart = openTag.length;
        return { content: input.slice(contentStart, i), length: totalLen };
      }
      i = endBrace !== -1 ? endBrace + 1 : i + 5;
    } else {
      i++;
    }
  }
  return null;
}

/* ── Main parser ─────────────────────────────────── */

export function parseLatex(source: string): ASTNode[] {
  const docMatch = source.match(
    /\\begin\{document\}([\s\S]*?)\\end\{document\}/
  );
  const preamble = source.split("\\begin{document}")[0] || "";
  const body = docMatch ? docMatch[1] : source;

  const titleMatch = preamble.match(/\\title\{([^}]*)\}/);
  const authorMatch = preamble.match(/\\author\{([^}]*)\}/);
  const dateMatch = preamble.match(/\\date\{([^}]*)\}/);

  const nodes: ASTNode[] = [];

  if (body.includes("\\maketitle") && titleMatch) {
    nodes.push({
      type: "title",
      title: titleMatch[1],
      author: authorMatch ? authorMatch[1] : "",
      date: dateMatch ? dateMatch[1].replace("\\today", new Date().toLocaleDateString()) : "",
    });
  }

  const cleanBody = body.replace(/\\maketitle/, "").replace(/\\tableofcontents/, "");
  tokenize(cleanBody, nodes);

  return nodes;
}

/* ── List parsing ─────────────────────────────────── */

function parseListItems(content: string, ordered: boolean): ASTNode {
  // Split on \item at the top level (not inside nested environments)
  const items: ListItem[] = [];
  const parts = splitOnItem(content);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Check if this item contains a nested list environment
    const itemNodes: ASTNode[] = [];
    let nestedList: ASTNode | undefined;
    let remaining = trimmed;

    // Extract nested lists from the item content
    while (remaining.length > 0) {
      const nestedItemize = matchEnvironment(remaining, "itemize");
      const nestedEnum = matchEnvironment(remaining, "enumerate");
      const nestedDesc = matchEnvironment(remaining, "description");

      const nested = nestedItemize || nestedEnum || nestedDesc;
      if (nested) {
        const beforeNested = remaining.slice(0, remaining.indexOf("\\begin{"));
        if (beforeNested.trim()) {
          parseInlineText(beforeNested.trim(), itemNodes);
        }

        if (nestedItemize && remaining.startsWith("\\begin{itemize}")) {
          nestedList = parseListItems(nested.content, false);
        } else if (nestedEnum && remaining.startsWith("\\begin{enumerate}")) {
          nestedList = parseListItems(nested.content, true);
        } else if (nestedDesc && remaining.startsWith("\\begin{description}")) {
          nestedList = parseDescriptionList(nested.content);
        }

        remaining = remaining.slice(nested.length).trim();
      } else {
        parseInlineText(remaining, itemNodes);
        break;
      }
    }

    items.push({ content: itemNodes, nestedList });
  }

  return { type: "list", ordered, items };
}

function parseDescriptionList(content: string): ASTNode {
  const items: { term: string; description: ASTNode[] }[] = [];
  // Split on \item[...] for description lists
  const parts = content.split(/\\item\s*\[/);

  for (let i = 1; i < parts.length; i++) {
    const bracketEnd = parts[i].indexOf("]");
    if (bracketEnd === -1) continue;
    const term = parts[i].slice(0, bracketEnd);
    const desc = parts[i].slice(bracketEnd + 1).trim();
    const descNodes: ASTNode[] = [];
    if (desc) parseInlineText(desc, descNodes);
    items.push({ term, description: descNodes });
  }

  return { type: "description-list", items };
}

function splitOnItem(content: string): string[] {
  // Split content on \item that are NOT inside nested \begin{...}\end{...}
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  let i = 0;

  while (i < content.length) {
    if (content.startsWith("\\begin{", i)) {
      depth++;
      const endBrace = content.indexOf("}", i + 7);
      const chunk = content.slice(i, endBrace !== -1 ? endBrace + 1 : i + 7);
      current += chunk;
      i += chunk.length;
    } else if (content.startsWith("\\end{", i)) {
      depth--;
      const endBrace = content.indexOf("}", i + 5);
      const chunk = content.slice(i, endBrace !== -1 ? endBrace + 1 : i + 5);
      current += chunk;
      i += chunk.length;
    } else if (depth === 0 && content.startsWith("\\item", i)) {
      if (current.trim()) parts.push(current);
      current = "";
      // Skip \item and optional [...] argument
      i += 5;
      // Skip whitespace
      while (i < content.length && content[i] === " ") i++;
      // Skip optional [term] for description lists
      if (content[i] === "[") {
        // Don't skip — description lists handle this differently
        // For itemize/enumerate, just skip the \item keyword
      }
    } else {
      current += content[i];
      i++;
    }
  }
  if (current.trim()) parts.push(current);
  return parts;
}

/* ── Tokenizer ────────────────────────────────────── */

function tokenize(input: string, nodes: ASTNode[]) {
  let remaining = input;

  while (remaining.length > 0) {
    remaining = remaining.replace(/^\s*\n\s*/, "\n");

    if (remaining.length === 0) break;

    // Comments
    const commentMatch = remaining.match(/^%[^\n]*/);
    if (commentMatch) {
      remaining = remaining.slice(commentMatch[0].length);
      continue;
    }

    // Display math \[ ... \]
    const displayMath1 = remaining.match(/^\\\[([\s\S]*?)\\\]/);
    if (displayMath1) {
      nodes.push({ type: "math-display", content: displayMath1[1].trim() });
      remaining = remaining.slice(displayMath1[0].length);
      continue;
    }

    // Display math $$ ... $$
    const displayMath2 = remaining.match(/^\$\$([\s\S]*?)\$\$/);
    if (displayMath2) {
      nodes.push({ type: "math-display", content: displayMath2[1].trim() });
      remaining = remaining.slice(displayMath2[0].length);
      continue;
    }

    // Equation environment
    const eqMatch = remaining.match(
      /^\\begin\{(equation|align|align\*|equation\*|gather|gather\*)\}([\s\S]*?)\\end\{\1\}/
    );
    if (eqMatch) {
      nodes.push({ type: "math-display", content: eqMatch[2].trim() });
      remaining = remaining.slice(eqMatch[0].length);
      continue;
    }

    // Abstract
    const abstractMatch = matchEnvironment(remaining, "abstract");
    if (abstractMatch) {
      nodes.push({ type: "abstract", content: abstractMatch.content.trim() });
      remaining = remaining.slice(abstractMatch.length);
      continue;
    }

    // Sections
    const sectionMatch = remaining.match(
      /^\\(chapter|section|subsection|subsubsection)\*?\{/
    );
    if (sectionMatch) {
      const afterCmd = remaining.slice(sectionMatch[0].length - 1); // keep the {
      const braced = matchBracedArg(afterCmd);
      if (braced) {
        const levels: Record<string, number> = {
          chapter: 0,
          section: 1,
          subsection: 2,
          subsubsection: 3,
        };
        nodes.push({
          type: "section",
          level: levels[sectionMatch[1]],
          title: braced.content,
        });
        remaining = remaining.slice(sectionMatch[0].length - 1 + braced.length);
        continue;
      }
    }

    // Table environment (use brace-depth-aware matching)
    if (remaining.startsWith("\\begin{table}") || remaining.startsWith("\\begin{tabular}")) {
      const envName = remaining.startsWith("\\begin{table}") ? "table" : "tabular";
      const tableEnv = matchEnvironment(remaining, envName);
      if (tableEnv) {
        nodes.push({ type: "table", content: remaining.slice(0, tableEnv.length) });
        remaining = remaining.slice(tableEnv.length);
        continue;
      }
    }

    // Figure environment
    if (remaining.startsWith("\\begin{figure}")) {
      const figEnv = matchEnvironment(remaining, "figure");
      if (figEnv) {
        const inner = figEnv.content;
        const srcMatch = inner.match(/\\includegraphics(\[[^\]]*\])?\{([^}]*)\}/);
        // Use brace-depth for caption
        const capIdx = inner.indexOf("\\caption{");
        let caption = "";
        if (capIdx !== -1) {
          const capBraced = matchBracedArg(inner.slice(capIdx + 8));
          if (capBraced) caption = capBraced.content;
        }
        const labelMatch = inner.match(/\\label\{([^}]*)\}/);
        nodes.push({
          type: "figure",
          src: srcMatch ? srcMatch[2] : "",
          caption,
          label: labelMatch ? labelMatch[1] : "",
        });
        remaining = remaining.slice(figEnv.length);
        continue;
      }
    }

    // List environments (itemize, enumerate) — brace-depth-aware
    if (remaining.startsWith("\\begin{itemize}") || remaining.startsWith("\\begin{enumerate}")) {
      const envName = remaining.startsWith("\\begin{itemize}") ? "itemize" : "enumerate";
      const listEnv = matchEnvironment(remaining, envName);
      if (listEnv) {
        const listNode = parseListItems(listEnv.content, envName === "enumerate");
        nodes.push(listNode);
        remaining = remaining.slice(listEnv.length);
        continue;
      }
    }

    // Description list
    if (remaining.startsWith("\\begin{description}")) {
      const descEnv = matchEnvironment(remaining, "description");
      if (descEnv) {
        nodes.push(parseDescriptionList(descEnv.content));
        remaining = remaining.slice(descEnv.length);
        continue;
      }
    }

    // Bibliography
    if (remaining.startsWith("\\begin{thebibliography}")) {
      const bibEnv = matchEnvironment(remaining, "thebibliography");
      if (bibEnv) {
        // Strip the {width} argument at the start
        const bibContent = bibEnv.content.replace(/^\{[^}]*\}/, "");
        const bibItems = bibContent
          .split("\\bibitem")
          .slice(1)
          .map((s) => {
            const keyMatch = s.match(/^\{([^}]*)\}/);
            return {
              key: keyMatch ? keyMatch[1] : "",
              text: keyMatch ? s.slice(keyMatch[0].length).trim() : s.trim(),
            };
          });
        nodes.push({ type: "bibliography", items: bibItems });
        remaining = remaining.slice(bibEnv.length);
        continue;
      }
    }

    // Unknown environment → raw (brace-depth-aware)
    const unknownEnvMatch = remaining.match(/^\\begin\{([^}]+)\}/);
    if (unknownEnvMatch) {
      const envName = unknownEnvMatch[1];
      const envResult = matchEnvironment(remaining, envName);
      if (envResult) {
        nodes.push({ type: "raw", content: remaining.slice(0, envResult.length) });
        remaining = remaining.slice(envResult.length);
        continue;
      }
    }

    // Collect text until next command or environment
    const textMatch = remaining.match(
      /^([\s\S]*?)(?=\\(?:section|subsection|subsubsection|chapter|begin|end|\[)|(?<!\$)\$\$|\$(?!\$)|$)/
    );
    if (textMatch && textMatch[1].length > 0) {
      const text = textMatch[1];
      parseInlineText(text, nodes);
      remaining = remaining.slice(text.length);
      continue;
    }

    // Inline math $...$
    const inlineMath = remaining.match(/^\$([^$]+?)\$/);
    if (inlineMath) {
      nodes.push({ type: "math-inline", content: inlineMath[1] });
      remaining = remaining.slice(inlineMath[0].length);
      continue;
    }

    // Avoid infinite loop
    if (remaining.length > 0) {
      nodes.push({ type: "text", content: remaining[0] });
      remaining = remaining.slice(1);
    }
  }
}

/* ── Inline text parser ──────────────────────────── */

export function parseInlineText(text: string, nodes: ASTNode[]) {
  let remaining = text;
  let buffer = "";

  while (remaining.length > 0) {
    // Inline math
    const inlineMath = remaining.match(/^\$([^$]+?)\$/);
    if (inlineMath) {
      if (buffer) { nodes.push({ type: "text", content: buffer }); buffer = ""; }
      nodes.push({ type: "math-inline", content: inlineMath[1] });
      remaining = remaining.slice(inlineMath[0].length);
      continue;
    }

    // \textbf{...} — brace-depth-aware
    if (remaining.startsWith("\\textbf{")) {
      const braced = matchBracedArg(remaining.slice(7));
      if (braced) {
        if (buffer) { nodes.push({ type: "text", content: buffer }); buffer = ""; }
        nodes.push({ type: "bold", content: braced.content });
        remaining = remaining.slice(7 + braced.length);
        continue;
      }
    }

    // \textit{...} — brace-depth-aware
    if (remaining.startsWith("\\textit{")) {
      const braced = matchBracedArg(remaining.slice(7));
      if (braced) {
        if (buffer) { nodes.push({ type: "text", content: buffer }); buffer = ""; }
        nodes.push({ type: "italic", content: braced.content });
        remaining = remaining.slice(7 + braced.length);
        continue;
      }
    }

    // \emph{...}
    if (remaining.startsWith("\\emph{")) {
      const braced = matchBracedArg(remaining.slice(5));
      if (braced) {
        if (buffer) { nodes.push({ type: "text", content: buffer }); buffer = ""; }
        nodes.push({ type: "italic", content: braced.content });
        remaining = remaining.slice(5 + braced.length);
        continue;
      }
    }

    // \texttt{...}
    if (remaining.startsWith("\\texttt{")) {
      const braced = matchBracedArg(remaining.slice(7));
      if (braced) {
        if (buffer) { nodes.push({ type: "text", content: buffer }); buffer = ""; }
        nodes.push({ type: "code", content: braced.content });
        remaining = remaining.slice(7 + braced.length);
        continue;
      }
    }

    // \href{url}{text}
    if (remaining.startsWith("\\href{")) {
      const urlBraced = matchBracedArg(remaining.slice(5));
      if (urlBraced) {
        const afterUrl = remaining.slice(5 + urlBraced.length);
        const textBraced = matchBracedArg(afterUrl);
        if (textBraced) {
          if (buffer) { nodes.push({ type: "text", content: buffer }); buffer = ""; }
          nodes.push({ type: "href", url: urlBraced.content, text: textBraced.content });
          remaining = remaining.slice(5 + urlBraced.length + textBraced.length);
          continue;
        }
      }
    }

    // \textcolor{color}{text}
    if (remaining.startsWith("\\textcolor{")) {
      const colorBraced = matchBracedArg(remaining.slice(10));
      if (colorBraced) {
        const afterColor = remaining.slice(10 + colorBraced.length);
        const textBraced = matchBracedArg(afterColor);
        if (textBraced) {
          if (buffer) { nodes.push({ type: "text", content: buffer }); buffer = ""; }
          nodes.push({ type: "color", color: colorBraced.content, content: textBraced.content });
          remaining = remaining.slice(10 + colorBraced.length + textBraced.length);
          continue;
        }
      }
    }

    // \footnote{...}
    if (remaining.startsWith("\\footnote{")) {
      const braced = matchBracedArg(remaining.slice(9));
      if (braced) {
        if (buffer) { nodes.push({ type: "text", content: buffer }); buffer = ""; }
        nodes.push({ type: "footnote", content: braced.content });
        remaining = remaining.slice(9 + braced.length);
        continue;
      }
    }

    // \cite{key1,key2}
    if (remaining.startsWith("\\cite{")) {
      const braced = matchBracedArg(remaining.slice(5));
      if (braced) {
        if (buffer) { nodes.push({ type: "text", content: buffer }); buffer = ""; }
        const keys = braced.content.split(",").map((k) => k.trim());
        nodes.push({ type: "cite", keys });
        remaining = remaining.slice(5 + braced.length);
        continue;
      }
    }

    // LaTeX special chars
    const specialMatch = remaining.match(/^\\([%#&_{}~^])/);
    if (specialMatch) {
      buffer += specialMatch[1];
      remaining = remaining.slice(specialMatch[0].length);
      continue;
    }

    // \\ or \newline
    const newlineMatch = remaining.match(/^(\\\\|\\newline)/);
    if (newlineMatch) {
      if (buffer) { nodes.push({ type: "text", content: buffer }); buffer = ""; }
      nodes.push({ type: "text", content: "\n" });
      remaining = remaining.slice(newlineMatch[0].length);
      continue;
    }

    // \ref{...}, \label{...} — render as text
    if (remaining.startsWith("\\ref{") || remaining.startsWith("\\label{")) {
      const cmdLen = remaining.startsWith("\\ref{") ? 4 : 6;
      const braced = matchBracedArg(remaining.slice(cmdLen));
      if (braced) {
        buffer += `(${braced.content})`;
        remaining = remaining.slice(cmdLen + braced.length);
        continue;
      }
    }

    // Other unknown commands with braced argument
    const unknownCmd = remaining.match(/^\\([a-zA-Z]+)\{/);
    if (unknownCmd) {
      const braced = matchBracedArg(remaining.slice(unknownCmd[0].length - 1));
      if (braced) {
        buffer += braced.content;
        remaining = remaining.slice(unknownCmd[0].length - 1 + braced.length);
        continue;
      }
    }

    // Skip bare commands like \noindent
    const bareCmd = remaining.match(/^\\([a-zA-Z]+)/);
    if (bareCmd) {
      remaining = remaining.slice(bareCmd[0].length);
      continue;
    }

    buffer += remaining[0];
    remaining = remaining.slice(1);
  }

  if (buffer.trim()) {
    nodes.push({ type: "text", content: buffer });
  }
}
