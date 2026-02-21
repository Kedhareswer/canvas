import { ASTNode, parseInlineText } from "./parser";
import { renderMathToString } from "./katex";

export function renderAST(nodes: ASTNode[]): string {
  return nodes.map((node, i) => renderNode(node, i)).join("");
}

/** Parse inline LaTeX commands and render to HTML (no <p> wrappers) */
function renderInlineContent(raw: string): string {
  const nodes: ASTNode[] = [];
  parseInlineText(raw, nodes);
  return nodes
    .map((node, i) => {
      if (node.type === "text") return escapeHtml(node.content);
      return renderNode(node, i);
    })
    .join("");
}

/** Render an array of already-parsed AST nodes to HTML */
function renderNodes(nodes: ASTNode[]): string {
  return nodes
    .map((node, i) => {
      if (node.type === "text") return escapeHtml(node.content);
      return renderNode(node, i);
    })
    .join("");
}

function renderNode(node: ASTNode, key: number): string {
  switch (node.type) {
    case "title":
      return `
        <div class="latex-title" key="${key}">
          <h1 class="latex-doc-title">${renderInlineContent(node.title)}</h1>
          ${node.author ? `<p class="latex-author">${renderInlineContent(node.author)}</p>` : ""}
          ${node.date ? `<p class="latex-date">${renderInlineContent(node.date)}</p>` : ""}
        </div>
      `;

    case "abstract":
      return `
        <div class="latex-abstract" key="${key}">
          <h3 class="latex-abstract-title">Abstract</h3>
          <p>${renderInlineContent(node.content)}</p>
        </div>
      `;

    case "section": {
      const tags = ["h1", "h2", "h3", "h4"];
      const tag = tags[node.level] || "h4";
      return `<${tag} class="latex-section latex-section-${node.level}" key="${key}">${renderInlineContent(node.title)}</${tag}>`;
    }

    case "text":
      return processTextContent(node.content, key);

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
          ${node.caption ? `<figcaption class="latex-caption">${renderInlineContent(node.caption)}</figcaption>` : ""}
        </figure>
      `;
    }

    case "list": {
      const tag = node.ordered ? "ol" : "ul";
      const items = node.items
        .map((item, i) => {
          const contentHtml = renderNodes(item.content);
          const nestedHtml = item.nestedList ? renderNode(item.nestedList, i + 1000) : "";
          return `<li key="${i}">${contentHtml}${nestedHtml}</li>`;
        })
        .join("");
      return `<${tag} class="latex-list" key="${key}">${items}</${tag}>`;
    }

    case "description-list": {
      const items = node.items
        .map((item, i) => {
          const descHtml = renderNodes(item.description);
          return `<dt key="dt-${i}">${renderInlineContent(item.term)}</dt><dd key="dd-${i}">${descHtml}</dd>`;
        })
        .join("");
      return `<dl class="latex-description-list" key="${key}">${items}</dl>`;
    }

    case "cite": {
      const links = node.keys
        .map((k) => `<a href="#ref-${escapeAttr(k)}" class="latex-cite">${escapeHtml(k)}</a>`)
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
            ${node.items.map((item, i) => `<li key="${i}" id="ref-${escapeAttr(item.key)}">${renderInlineContent(item.text)}</li>`).join("")}
          </ol>
        </div>
      `;

    case "raw":
      return `<pre class="latex-raw" key="${key}">${escapeHtml(node.content)}</pre>`;

    default:
      return "";
  }
}

function processTextContent(content: string, key: number): string {
  const paragraphs = content.split(/\n{2,}/);
  if (paragraphs.length > 1) {
    return paragraphs
      .filter((p) => p.trim())
      .map((p, i) => `<p class="latex-paragraph" key="${key}-${i}">${renderInlineContent(p.trim())}</p>`)
      .join("");
  }
  const trimmed = content.trim();
  if (!trimmed) return "";
  return `<p class="latex-paragraph" key="${key}">${renderInlineContent(trimmed)}</p>`;
}

function renderTable(content: string, key: number): string {
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
      html += `<${cellTag}>${renderInlineContent(cell)}</${cellTag}>`;
    });
    html += "</tr>";
  });

  html += "</table>";
  if (captionMatch) {
    html += `<p class="latex-table-caption">${renderInlineContent(captionMatch[1])}</p>`;
  }
  html += "</div>";
  return html;
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
