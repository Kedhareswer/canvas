export type ASTNode =
  | { type: "text"; content: string }
  | { type: "section"; level: number; title: string }
  | { type: "math-inline"; content: string }
  | { type: "math-display"; content: string }
  | { type: "table"; content: string }
  | { type: "figure"; src: string; caption: string; label: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "bibliography"; items: { key: string; text: string }[] }
  | { type: "title"; title: string; author: string; date: string }
  | { type: "abstract"; content: string }
  | { type: "raw"; content: string }
  | { type: "bold"; content: string }
  | { type: "italic"; content: string }
  | { type: "code"; content: string }
  | { type: "href"; url: string; text: string }
  | { type: "color"; color: string; content: string };

export function parseLatex(source: string): ASTNode[] {
  // Extract body between \begin{document} and \end{document}
  const docMatch = source.match(
    /\\begin\{document\}([\s\S]*?)\\end\{document\}/
  );
  const preamble = source.split("\\begin{document}")[0] || "";
  const body = docMatch ? docMatch[1] : source;

  // Extract title/author/date from preamble
  const titleMatch = preamble.match(/\\title\{([^}]*)\}/);
  const authorMatch = preamble.match(/\\author\{([^}]*)\}/);
  const dateMatch = preamble.match(/\\date\{([^}]*)\}/);

  const nodes: ASTNode[] = [];

  // Check for \maketitle in body
  if (body.includes("\\maketitle") && titleMatch) {
    nodes.push({
      type: "title",
      title: titleMatch[1],
      author: authorMatch ? authorMatch[1] : "",
      date: dateMatch ? dateMatch[1].replace("\\today", new Date().toLocaleDateString()) : "",
    });
  }

  // Tokenize remaining body (remove \maketitle)
  const cleanBody = body.replace(/\\maketitle/, "").replace(/\\tableofcontents/, "");
  tokenize(cleanBody, nodes);

  return nodes;
}

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
    const abstractMatch = remaining.match(
      /^\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/
    );
    if (abstractMatch) {
      nodes.push({ type: "abstract", content: abstractMatch[1].trim() });
      remaining = remaining.slice(abstractMatch[0].length);
      continue;
    }

    // Sections
    const sectionMatch = remaining.match(
      /^\\(chapter|section|subsection|subsubsection)\*?\{([^}]*)\}/
    );
    if (sectionMatch) {
      const levels: Record<string, number> = {
        chapter: 0,
        section: 1,
        subsection: 2,
        subsubsection: 3,
      };
      nodes.push({
        type: "section",
        level: levels[sectionMatch[1]],
        title: sectionMatch[2],
      });
      remaining = remaining.slice(sectionMatch[0].length);
      continue;
    }

    // Table environment
    const tableMatch = remaining.match(
      /^\\begin\{(table|tabular)\}(\[[^\]]*\])?\{?[^}]*\}?([\s\S]*?)\\end\{\1\}/
    );
    if (tableMatch) {
      nodes.push({ type: "table", content: tableMatch[0] });
      remaining = remaining.slice(tableMatch[0].length);
      continue;
    }

    // Figure environment
    const figureMatch = remaining.match(
      /^\\begin\{figure\}(\[[^\]]*\])?([\s\S]*?)\\end\{figure\}/
    );
    if (figureMatch) {
      const inner = figureMatch[2];
      const srcMatch = inner.match(/\\includegraphics(\[[^\]]*\])?\{([^}]*)\}/);
      const capMatch = inner.match(/\\caption\{([^}]*)\}/);
      const labelMatch = inner.match(/\\label\{([^}]*)\}/);
      nodes.push({
        type: "figure",
        src: srcMatch ? srcMatch[2] : "",
        caption: capMatch ? capMatch[1] : "",
        label: labelMatch ? labelMatch[1] : "",
      });
      remaining = remaining.slice(figureMatch[0].length);
      continue;
    }

    // List environments
    const listMatch = remaining.match(
      /^\\begin\{(itemize|enumerate)\}([\s\S]*?)\\end\{\1\}/
    );
    if (listMatch) {
      const items = listMatch[2]
        .split("\\item")
        .slice(1)
        .map((s) => s.trim());
      nodes.push({
        type: "list",
        ordered: listMatch[1] === "enumerate",
        items,
      });
      remaining = remaining.slice(listMatch[0].length);
      continue;
    }

    // Bibliography
    const bibMatch = remaining.match(
      /^\\begin\{thebibliography\}\{[^}]*\}([\s\S]*?)\\end\{thebibliography\}/
    );
    if (bibMatch) {
      const bibItems = bibMatch[1]
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
      remaining = remaining.slice(bibMatch[0].length);
      continue;
    }

    // Unknown environment → raw
    const envMatch = remaining.match(
      /^\\begin\{([^}]+)\}([\s\S]*?)\\end\{\1\}/
    );
    if (envMatch) {
      nodes.push({ type: "raw", content: envMatch[0] });
      remaining = remaining.slice(envMatch[0].length);
      continue;
    }

    // Collect text until next command or environment
    const textMatch = remaining.match(
      /^([\s\S]*?)(?=\\(?:section|subsection|subsubsection|chapter|begin|end|\[)|(?<!\$)\$\$|\$(?!\$)|$)/
    );
    if (textMatch && textMatch[1].length > 0) {
      const text = textMatch[1];
      // Process inline elements within text
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

    // If nothing matched, consume one character to avoid infinite loop
    if (remaining.length > 0) {
      nodes.push({ type: "text", content: remaining[0] });
      remaining = remaining.slice(1);
    }
  }
}

export function parseInlineText(text: string, nodes: ASTNode[]) {
  // Split text on inline commands and math
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

    // \textbf{...}
    const boldMatch = remaining.match(/^\\textbf\{([^}]*)\}/);
    if (boldMatch) {
      if (buffer) { nodes.push({ type: "text", content: buffer }); buffer = ""; }
      nodes.push({ type: "bold", content: boldMatch[1] });
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // \textit{...}
    const italicMatch = remaining.match(/^\\textit\{([^}]*)\}/);
    if (italicMatch) {
      if (buffer) { nodes.push({ type: "text", content: buffer }); buffer = ""; }
      nodes.push({ type: "italic", content: italicMatch[1] });
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // \emph{...}
    const emphMatch = remaining.match(/^\\emph\{([^}]*)\}/);
    if (emphMatch) {
      if (buffer) { nodes.push({ type: "text", content: buffer }); buffer = ""; }
      nodes.push({ type: "italic", content: emphMatch[1] });
      remaining = remaining.slice(emphMatch[0].length);
      continue;
    }

    // \texttt{...}
    const codeMatch = remaining.match(/^\\texttt\{([^}]*)\}/);
    if (codeMatch) {
      if (buffer) { nodes.push({ type: "text", content: buffer }); buffer = ""; }
      nodes.push({ type: "code", content: codeMatch[1] });
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // \href{url}{text}
    const hrefMatch = remaining.match(/^\\href\{([^}]*)\}\{([^}]*)\}/);
    if (hrefMatch) {
      if (buffer) { nodes.push({ type: "text", content: buffer }); buffer = ""; }
      nodes.push({ type: "href", url: hrefMatch[1], text: hrefMatch[2] });
      remaining = remaining.slice(hrefMatch[0].length);
      continue;
    }

    // \textcolor{color}{text}
    const colorMatch = remaining.match(/^\\textcolor\{([^}]*)\}\{([^}]*)\}/);
    if (colorMatch) {
      if (buffer) { nodes.push({ type: "text", content: buffer }); buffer = ""; }
      nodes.push({ type: "color", color: colorMatch[1], content: colorMatch[2] });
      remaining = remaining.slice(colorMatch[0].length);
      continue;
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

    // Skip unknown commands like \label{...}, \cite{...}
    const unknownCmd = remaining.match(/^\\([a-zA-Z]+)\{([^}]*)\}/);
    if (unknownCmd) {
      // Render common ones as text
      if (unknownCmd[1] === "cite") {
        buffer += `[${unknownCmd[2]}]`;
      } else if (unknownCmd[1] === "ref" || unknownCmd[1] === "label") {
        buffer += `(${unknownCmd[2]})`;
      } else {
        buffer += unknownCmd[2];
      }
      remaining = remaining.slice(unknownCmd[0].length);
      continue;
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
