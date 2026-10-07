"use client";

// Shows a member/partner/coalition/business-contact account's own
// published Shared Documents (the "Word document"-style write-ups Jody
// publishes from the Business Professional Services admin page) - with a
// read-only viewer and a PDF download, matching what Jody sees when she
// writes them.

import { useState, useEffect, useCallback, useRef } from "react";
import { FileText, Download, X } from "lucide-react";
import { RichTextEditor, RichContent } from "@/components/ui/rich-text-editor";
import { downloadNodeAsLetterPdf, DOCUMENT_PAGE_WIDTH } from "@/lib/document-pdf";
import { supabase } from "@/lib/supabase/client";
import {
  getMyPublishedDocuments,
  type SharedDocumentRow,
} from "@/lib/supabase/dashboard-data";

function DocumentViewerModal({
  doc,
  onClose,
}: {
  doc: SharedDocumentRow;
  onClose: () => void;
}) {
  const [exportingPdf, setExportingPdf] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!printRef.current) return;
    setExportingPdf(true);
    try {
      const slug = (doc.title || "document").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await downloadNodeAsLetterPdf(printRef.current, `${slug}.pdf`);
    } catch (err) {
      console.error("Failed to export document to PDF:", err);
      alert("Couldn't download that document as a PDF. Please try again.");
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-5 border-b border-gray-100 flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">{doc.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="bg-white" style={{ width: "100%", maxWidth: 800 }}>
            <p className="text-xs text-gray-400 mb-4">
              Published {new Date(doc.published_at ?? doc.updated_at).toLocaleString()}
            </p>
            <RichContent html={doc.content} />
          </div>
        </div>
        {/* Off-screen, fixed-width copy (title + content) captured for the PDF. */}
        <div style={{ position: "fixed", top: 0, left: -99999, width: DOCUMENT_PAGE_WIDTH }}>
          <div ref={printRef} className="bg-white" style={{ width: DOCUMENT_PAGE_WIDTH, padding: 56 }}>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">{doc.title}</h1>
            <p className="text-sm text-gray-400 mb-6">
              Published {new Date(doc.published_at ?? doc.updated_at).toLocaleDateString()}
            </p>
            <RichContent html={doc.content} />
          </div>
        </div>
        <div className="sticky bottom-0 bg-white p-5 border-t border-gray-100 flex justify-end">
          <button
            onClick={handleDownload}
            disabled={exportingPdf}
            className="px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {exportingPdf ? "Exporting…" : "Download PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SharedDocumentsCard({ userId }: { userId: string | null }) {
  const [documents, setDocuments] = useState<SharedDocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingDoc, setViewingDoc] = useState<SharedDocumentRow | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");

  const loadDocuments = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const data = await getMyPublishedDocuments(userId);
      setDocuments(data);
      // Small support line shown only when the list is empty.
      const { data: authData } = await supabase.auth.getUser();
      setDebugInfo(
        `Signed in as ${authData.user?.email ?? "unknown"} (id ${(authData.user?.id ?? "").slice(0, 8)}…) · ${data.length} found`,
      );
    } catch (err) {
      console.error("Failed to load shared documents:", err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="h-5 w-5 text-indigo-600" />
        <h3 className="font-semibold text-gray-900">Documents from Jody</h3>
      </div>
      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : loadError ? (
        <p className="text-sm text-amber-700">
          We couldn't load your documents right now. Please refresh, or email Jody if this
          keeps happening.
        </p>
      ) : documents.length === 0 ? (
        <p className="text-sm text-gray-400">
          No documents yet. When Jody shares a document with you, it will appear here.
        </p>
      ) : null}
      {!loading && !loadError && documents.length === 0 && debugInfo ? (
        <p className="text-[11px] text-gray-300 mt-2">{debugInfo}</p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setViewingDoc(doc)}
              className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-xl p-3 transition-colors flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                <p className="text-xs text-gray-400">
                  {new Date(doc.published_at ?? doc.updated_at).toLocaleDateString()}
                </p>
              </div>
              <span className="shrink-0 text-xs text-indigo-600 font-medium">View →</span>
            </button>
          ))}
        </div>
      )}
      {viewingDoc && (
        <DocumentViewerModal doc={viewingDoc} onClose={() => setViewingDoc(null)} />
      )}
    </div>
  );
}
