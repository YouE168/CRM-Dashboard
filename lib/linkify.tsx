import type { ReactNode } from "react";

// Auto-detects http(s) URLs pasted into free-text note/message content
// (admin broadcast notes, mentor-to-mentee notes, etc.) and renders them as
// clickable links - no separate "link" field needed on any note form, this
// just makes whatever URL someone pastes into the text itself clickable.
const URL_PATTERN = /(https?:\/\/[^\s<>"')]+)/g;

export function linkifyText(text: string | null | undefined): ReactNode {
  if (!text) return text;
  const parts = text.split(URL_PATTERN);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="underline text-blue-600 hover:text-blue-700 break-all"
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}
