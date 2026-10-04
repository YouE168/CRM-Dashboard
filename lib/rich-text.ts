// Helpers for the document editor's rich text (bold/italic/underline,
// font size, bullet/numbered lists). Documents are stored as a small,
// allow-listed subset of HTML in shared_documents.content. Older
// documents were written as plain text, so everything goes through
// contentToHtml() first, and through sanitizeHtml() before being shown
// anywhere - never trust stored HTML as-is.

const ALLOWED_TAGS = new Set([
  "B", "STRONG", "I", "EM", "U", "UL", "OL", "LI", "P", "DIV", "BR", "FONT",
  "H1", "H2", "H3",
]);
const DROP_ENTIRELY = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED"]);

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const LOOKS_LIKE_HTML = /<\/?(p|div|br|b|strong|i|em|u|ul|ol|li|font|h1|h2|h3)\b/i;

// Old plain-text documents -> HTML (keeps their line breaks).
export function contentToHtml(content: string): string {
  if (!content) return "";
  if (LOOKS_LIKE_HTML.test(content)) return content;
  return escapeHtml(content).replace(/\r?\n/g, "<br>");
}

export function sanitizeHtml(html: string): string {
  if (!html) return "";
  // Server render (no DOM available): fall back to fully escaped text.
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return escapeHtml(html.replace(/<[^>]*>/g, ""));
  }
  const parsed = new DOMParser().parseFromString(html, "text/html");
  const out = document.createElement("div");

  const walk = (source: Node, target: Node) => {
    source.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        target.appendChild(document.createTextNode(child.textContent ?? ""));
        return;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) return;
      const el = child as Element;
      if (DROP_ENTIRELY.has(el.tagName)) return;
      if (!ALLOWED_TAGS.has(el.tagName)) {
        walk(el, target); // unknown tag: keep its text, drop the tag
        return;
      }
      const clean = document.createElement(el.tagName.toLowerCase());
      if (el.tagName === "FONT") {
        const size = el.getAttribute("size");
        if (size && /^[1-7]$/.test(size)) clean.setAttribute("size", size);
      }
      // Text alignment - browsers write it as align="center" or
      // style="text-align: center" depending on the engine; keep only the
      // alignment value, never arbitrary styles.
      if (["DIV", "P", "H1", "H2", "H3", "LI", "UL", "OL"].includes(el.tagName)) {
        const raw =
          el.getAttribute("align") ||
          (el as HTMLElement).style?.textAlign ||
          "";
        if (["left", "center", "right", "justify"].includes(raw)) {
          clean.setAttribute("align", raw);
        }
      }
      walk(el, clean);
      target.appendChild(clean);
    });
  };

  walk(parsed.body, out);
  return out.innerHTML;
}

export function htmlIsEmpty(html: string): boolean {
  const text = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  return text.length === 0;
}
