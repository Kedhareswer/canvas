import { ASTNode, parseInlineText } from "./parser";
import { renderMathToString } from "./katex";

export function renderAST(nodes: ASTNode[]): string {
  const referenceIndexByKey = buildReferenceIndex(nodes);
  return nodes.map((node, i) => renderNode(node, i, referenceIndexByKey)).join("");
}

/** Parse inline LaTeX commands and render to HTML (no <p> wrappers) */
function renderInlineContent(raw: string, referenceIndexByKey: Map<string, number>): string {
  const nodes: ASTNode[] = [];
  parseInlineText(raw, nodes);
  return nodes
    .map((node, i) => {
      if (node.type === "text") return escapeHtml(node.content);
      return renderNode(node, i, referenceIndexByKey);
    })
    .join("");
}

/** Render an array of already-parsed AST nodes to HTML */
function renderNodes(nodes: ASTNode[], referenceIndexByKey: Map<string, number>): string {
  return nodes
    .map((node, i) => {
      if (node.type === "text") return escapeHtml(node.content);
      return renderNode(node, i, referenceIndexByKey);
    })
    .join("");
}

function renderNode(node: ASTNode, key: number, referenceIndexByKey: Map<string, number>): string {
  switch (node.type) {
    case "title":
      return `
        <div class="latex-title" key="${key}">
          <h1 class="latex-doc-title">${renderInlineContent(node.title, referenceIndexByKey)}</h1>
          ${node.author ? `<p class="latex-author">${renderInlineContent(node.author, referenceIndexByKey)}</p>` : ""}
          ${node.date ? `<p class="latex-date">${renderInlineContent(node.date, referenceIndexByKey)}</p>` : ""}
        </div>
      `;

    case "abstract":
      return `
        <div class="latex-abstract" key="${key}">
          <h3 class="latex-abstract-title">Abstract</h3>
          <p>${renderInlineContent(node.content, referenceIndexByKey)}</p>
        </div>
      `;

    case "section": {
      const tags = ["h1", "h2", "h3", "h4"];
      const tag = tags[node.level] || "h4";
      return `<${tag} class="latex-section latex-section-${node.level}" key="${key}">${renderInlineContent(node.title, referenceIndexByKey)}</${tag}>`;
    }

    case "text":
      return processTextContent(node.content, key, referenceIndexByKey);

    case "bold":
      return `<strong key="${key}">${escapeHtml(node.content)}</strong>`;

    case "italic":
      return `<em key="${key}">${escapeHtml(node.content)}</em>`;

    case "code":
      return `<code class="latex-code" key="${key}">${escapeHtml(node.content)}</code>`;

    case "href":
      return `<a href="${escapeAttr(node.url)}" class="latex-link" target="_blank" rel="noopener noreferrer" key="${key}">${escapeHtml(node.text)}</a>`;

    case "color":
      return `<span style="color: ${escapeAttr(node.color)}" key="${key}">${escapeHtml(node.content)}</span>`;

    case "math-inline":
      return renderMathToString(node.content, false);

    case "math-display":
      return `<div class="latex-math-display" key="${key}">${renderMathToString(node.content, true)}</div>`;

    case "table":
      return renderTable(node.content, key);

    case "figure": {
      const isGenPlaceholder = node.src.startsWith("[gen:");
      const isDataUri = node.src.startsWith("data:");
      const isUrl = node.src.startsWith("http") || node.src.startsWith("/api/images/") || isDataUri;
      const imgHtml = isGenPlaceholder
        ? `<div class="latex-figure-placeholder">${escapeHtml(node.src.slice(5, -1))}</div>`
        : isUrl || isDataUri
          ? `<img src="${escapeAttr(node.src)}" alt="${escapeAttr(node.caption)}" class="latex-figure-img" />`
          : `<div class="latex-figure-placeholder">${escapeHtml(node.src || "Image")}</div>`;
      return `
        <figure class="latex-figure" key="${key}"${node.label ? ` id="${escapeAttr(node.label)}"` : ""}>
          ${imgHtml}
          ${node.caption ? `<figcaption class="latex-caption">${renderInlineContent(node.caption, referenceIndexByKey)}</figcaption>` : ""}
        </figure>
      `;
    }

    case "list": {
      const tag = node.ordered ? "ol" : "ul";
      const items = node.items
        .map((item, i) => {
          const contentHtml = renderNodes(item.content, referenceIndexByKey);
          const nestedHtml = item.nestedList ? renderNode(item.nestedList, i + 1000, referenceIndexByKey) : "";
          return `<li key="${i}">${contentHtml}${nestedHtml}</li>`;
        })
        .join("");
      return `<${tag} class="latex-list" key="${key}">${items}</${tag}>`;
    }

    case "description-list": {
      const items = node.items
        .map((item, i) => {
          const descHtml = renderNodes(item.description, referenceIndexByKey);
          return `<dt key="dt-${i}">${renderInlineContent(item.term, referenceIndexByKey)}</dt><dd key="dd-${i}">${descHtml}</dd>`;
        })
        .join("");
      return `<dl class="latex-description-list" key="${key}">${items}</dl>`;
    }

    case "cite": {
      const links = node.keys
        .map((k) => {
          const referenceIndex = referenceIndexByKey.get(k);
          if (referenceIndex) {
            return `<a href="#ref-idx-${referenceIndex}" class="latex-cite">${referenceIndex}</a>`;
          }
          return `<a href="#ref-${escapeAttr(k)}" class="latex-cite">${escapeHtml(k)}</a>`;
        })
        .join(", ");
      return `<span class="latex-citations" key="${key}">[${links}]</span>`;
    }

    case "footnote":
      return `<sup class="latex-footnote" key="${key}" title="${escapeAttr(node.content)}">*</sup>`;

    case "bibliography":
      return `
        <div class="latex-bibliography" key="${key}">
          <h2 class="latex-section latex-section-1">References</h2>
          <ol class="latex-references">
            ${node.items.map((item, i) => `
              <li key="${i}" id="ref-idx-${i + 1}" data-ref-key="${escapeAttr(item.key)}">
                <span id="ref-${escapeAttr(item.key)}" class="latex-ref-anchor"></span>
                ${linkifyReferenceTargets(renderInlineContent(item.text, referenceIndexByKey))}
              </li>
            `).join("")}
          </ol>
        </div>
      `;

    case "raw":
      return `<pre class="latex-raw" key="${key}">${escapeHtml(node.content)}</pre>`;

    default:
      return "";
  }
}

function processTextContent(content: string, key: number, referenceIndexByKey: Map<string, number>): string {
  const paragraphs = content.split(/\n{2,}/);
  if (paragraphs.length > 1) {
    return paragraphs
      .filter((p) => p.trim())
      .map((p, i) => {
        const html = renderInlineContent(p.trim(), referenceIndexByKey);
        return `<p class="latex-paragraph" key="${key}-${i}">${linkifyBracketCitations(html)}</p>`;
      })
      .join("");
  }
  const trimmed = content.trim();
  if (!trimmed) return "";
  return `<p class="latex-paragraph" key="${key}">${linkifyBracketCitations(renderInlineContent(trimmed, referenceIndexByKey))}</p>`;
}

function renderTable(content: string, key: number, referenceIndexByKey?: Map<string, number>): string {
  const tabularMatch = content.match(
    /\\begin\{tabular\}\{([^}]*)\}([\s\S]*?)\\end\{tabular\}/
  );
  if (!tabularMatch) {
    return `<pre class="latex-raw" key="${key}">${escapeHtml(content)}</pre>`;
  }

  const body = tabularMatch[2];
  const rows = body
    .split(/\\\\/)
    .map((r) => r.trim())
    .filter((r) => r && !r.startsWith("\\hline") && !r.startsWith("\\toprule") && !r.startsWith("\\midrule") && !r.startsWith("\\bottomrule"));

  // Extract caption — use full content (table environment wrapping tabular)
  const captionMatch = content.match(/\\caption\{([^}]*)\}/);
  const labelMatch = content.match(/\\label\{([^}]*)\}/);

  let html = `<div class="latex-table-container" key="${key}"${labelMatch ? ` id="${escapeAttr(labelMatch[1])}"` : ""}>`;
  html += `<table class="latex-table">`;

  rows.forEach((row, i) => {
    let cleanRow = row
      .replace(/\\(hline|toprule|midrule|bottomrule)/g, "")
      .replace(/\\cline\{[^}]*\}/g, "")
      .trim();
    if (!cleanRow) return;

    // Handle \multicolumn{span}{align}{content}
    cleanRow = cleanRow.replace(
      /\\multicolumn\{(\d+)\}\{[^}]*\}\{([^}]*)\}/g,
      (_match, _span, cellContent) => cellContent
    );

    const cells = cleanRow.split("&").map((c) => c.trim());
    const cellTag = i === 0 ? "th" : "td";
    html += "<tr>";
    cells.forEach((cell) => {
      html += `<${cellTag}>${renderInlineContent(cell, referenceIndexByKey ?? new Map())}</${cellTag}>`;
    });
    html += "</tr>";
  });

  html += "</table>";
  if (captionMatch) {
    html += `<p class="latex-table-caption">${renderInlineContent(captionMatch[1], referenceIndexByKey ?? new Map())}</p>`;
  }
  html += "</div>";
  return html;
}

function buildReferenceIndex(nodes: ASTNode[]): Map<string, number> {
  const map = new Map<string, number>();
  const bibliographyNode = nodes.find((node) => node.type === "bibliography");
  if (!bibliographyNode || bibliographyNode.type !== "bibliography") return map;
  bibliographyNode.items.forEach((item, i) => {
    map.set(item.key, i + 1);
  });
  return map;
}

function linkifyBracketCitations(html: string): string {
  return html.replace(/\[(\d+(?:\s*,\s*\d+)*)\]/g, (_whole, rawNumbers) => {
    const numbers = String(rawNumbers)
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);
    const linked = numbers
      .map((n) => `<a href="#ref-idx-${escapeAttr(n)}" class="latex-cite">${escapeHtml(n)}</a>`)
      .join(", ");
    return `[${linked}]`;
  });
}

function linkifyReferenceTargets(html: string): string {
  // Link arXiv IDs (e.g. arXiv:2312.10997) to the paper page.
  const withArxivLinks = html.replace(
    /\barXiv:(\d{4}\.\d{4,5}(?:v\d+)?)\b/gi,
    (_whole, arxivId) =>
      `<a href="https://arxiv.org/abs/${escapeAttr(arxivId)}" class="latex-link" target="_blank" rel="noopener noreferrer">arXiv:${escapeHtml(arxivId)}</a>`
  );

  // Link plain HTTP(S) URLs.
  return withArxivLinks.replace(
    /(^|[\s(>])(https?:\/\/[^\s<)]+)(?=[)\].,;:]?(?:\s|$|<))/gi,
    (_whole, prefix, url) =>
      `${prefix}<a href="${escapeAttr(url)}" class="latex-link" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(str: string): string {
  return str.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
