"use client";

import { useRef, useEffect } from "react";
import { Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { contentToHtml, sanitizeHtml } from "@/lib/rich-text";

// Small Word-style editor for Shared Documents: bold, italic, underline,
// font size, bullet + numbered lists. Built on a contentEditable box and the
// browser's built-in formatting commands, so it needs no extra packages.
// onChange receives sanitized HTML.

const SIZE_OPTIONS = [
  { label: "Small", value: "2" },
  { label: "Normal", value: "3" },
  { label: "Medium", value: "4" },
  { label: "Large", value: "5" },
  { label: "Extra large", value: "6" },
];

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = 320,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Load the starting content once (editing a live contentEditable via
  // React state would reset the cursor on every keystroke).
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = sanitizeHtml(contentToHtml(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = () => {
    if (ref.current) onChange(sanitizeHtml(ref.current.innerHTML));
  };

  const run = (command: string, arg?: string) => {
    ref.current?.focus();
    // On a completely empty document there's no block to align yet - give
    // it one and put the cursor inside, so alignment can be picked before
    // typing anything.
    if (command.startsWith("justify") && ref.current && !ref.current.innerHTML.trim()) {
      ref.current.innerHTML = "<div><br></div>";
      const range = document.createRange();
      range.setStart(ref.current.firstChild as Node, 0);
      range.collapse(true);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
    document.execCommand("styleWithCSS", false, "false");
    document.execCommand(command, false, arg);
    emit();
  };

  const btn =
    "p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors";

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-400">
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
        <select
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) run("fontSize", e.target.value);
            e.target.value = "";
          }}
          onMouseDown={() => ref.current?.focus()}
          className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700"
          title="Font size"
        >
          <option value="">Font size</option>
          {SIZE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="w-px h-5 bg-gray-200 mx-1" />
        <button type="button" className={btn} title="Bold (Ctrl+B)" onMouseDown={(e) => { e.preventDefault(); run("bold"); }}>
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" className={btn} title="Italic (Ctrl+I)" onMouseDown={(e) => { e.preventDefault(); run("italic"); }}>
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" className={btn} title="Underline (Ctrl+U)" onMouseDown={(e) => { e.preventDefault(); run("underline"); }}>
          <Underline className="h-4 w-4" />
        </button>
        <span className="w-px h-5 bg-gray-200 mx-1" />
        <button type="button" className={btn} title="Align left" onMouseDown={(e) => { e.preventDefault(); run("justifyLeft"); }}>
          <AlignLeft className="h-4 w-4" />
        </button>
        <button type="button" className={btn} title="Center" onMouseDown={(e) => { e.preventDefault(); run("justifyCenter"); }}>
          <AlignCenter className="h-4 w-4" />
        </button>
        <button type="button" className={btn} title="Align right" onMouseDown={(e) => { e.preventDefault(); run("justifyRight"); }}>
          <AlignRight className="h-4 w-4" />
        </button>
        <span className="w-px h-5 bg-gray-200 mx-1" />
        <button type="button" className={btn} title="Bullet list" onMouseDown={(e) => { e.preventDefault(); run("insertUnorderedList"); }}>
          <List className="h-4 w-4" />
        </button>
        <button type="button" className={btn} title="Numbered list" onMouseDown={(e) => { e.preventDefault(); run("insertOrderedList"); }}>
          <ListOrdered className="h-4 w-4" />
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        data-placeholder={placeholder}
        className="rich-content rich-editor p-4 text-base leading-relaxed focus:outline-none"
        style={{ minHeight }}
      />
    </div>
  );
}

// Read-only display of a document's content (viewer, PDF capture).
export function RichContent({ html }: { html: string }) {
  return (
    <div
      className="rich-content text-base text-gray-800 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(contentToHtml(html)) || "&nbsp;" }}
    />
  );
}
