"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Search } from "lucide-react";
import {
  getAllDocumentsOverview,
  type DocumentOverviewRow,
} from "@/lib/supabase/dashboard-data";

// Admin overview of every document in the CRM - who it's for, whether
// it's published (visible on their dashboard) or still a draft.
export function AllDocumentsTab({
  reloadKey,
  onOpen,
}: {
  reloadKey: number;
  onOpen: (doc: DocumentOverviewRow) => void;
}) {
  const [docs, setDocs] = useState<DocumentOverviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "draft">("all");
  const [kind, setKind] = useState<"all" | "Member" | "Business" | "Group">("all");

  useEffect(() => {
    setLoading(true);
    getAllDocumentsOverview()
      .then(setDocs)
      .catch((e) => console.error("Failed to load documents:", e))
      .finally(() => setLoading(false));
  }, [reloadKey]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return docs.filter(
      (d) =>
        (status === "all" || d.status === status) &&
        (kind === "all" || d.recipientKind === kind) &&
        (!t || d.title.toLowerCase().includes(t) || d.recipientLabel.toLowerCase().includes(t)),
    );
  }, [docs, q, status, kind]);

  const sel =
    "text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700";

  return (
    <div>
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title or who it's shared with…"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <select className={sel} value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
          <option value="all">All recipients</option>
          <option value="Member">Members</option>
          <option value="Business">Businesses</option>
          <option value="Group">Group documents</option>
        </select>
        <select className={sel} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="all">Published + drafts</option>
          <option value="published">Published only</option>
          <option value="draft">Drafts only</option>
        </select>
      </div>

      <p className="text-sm text-gray-500 mb-3">
        {filtered.length} document{filtered.length === 1 ? "" : "s"}
      </p>

      {loading ? (
        <p className="text-sm text-gray-400">Loading documents…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-400">No documents match.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((d) => (
            <button
              key={d.id}
              onClick={() => onOpen(d)}
              className="w-full text-left bg-white border border-gray-100 hover:border-emerald-200 hover:shadow-sm rounded-xl p-4 transition-all"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-5 w-5 text-indigo-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{d.title}</p>
                    <p className="text-xs text-gray-500">
                      <span className="font-medium">{d.recipientKind}:</span> {d.recipientLabel}
                      {" · "}
                      Updated {new Date(d.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                    d.status === "published"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {d.status === "published" ? "Published" : "Draft"}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
