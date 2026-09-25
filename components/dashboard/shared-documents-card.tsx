"use client";

// Shows a member/partner/coalition/business-contact account's own
// published Shared Documents (the "Word document"-style write-ups Jody
// publishes from the Business Professional Services admin page) - with a
// read-only viewer and a PDF download, matching what Jody sees when she
// writes them.

import { useState, useEffect, useCallback, useRef } from "react";
import { FileText, Download, X } from "lucide-react";
import {
  getMyPublishedDocuments,
  type SharedDocumentRow,
} from "@/lib/supabase/dashboard-data";

function downloadDocumentPdf(
  node: HTMLDivElement,
  title: string,
  onDone: () => void,
  onError: () => void,
) {
  (async () => {
    try {
      const [{ toCanvas }, { default: jsPDF }] = await Promise.all([
        import("html-to-image"),
        import("jspdf"),
      ]);
      const rect = node.getBoundingClientRect();
      const canvas = await toCanvas(node, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        width: Math.ceil(rect.width),
        height: Math.ceil(rect.height),
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      const slug = (title || "document").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      pdf.save(`${slug}.pdf`);
      onDone();
    } catch (err) {
      console.error("Failed to export document to PDF:", err);
      onError();
    }
  })();
}

function DocumentViewerModal({
  doc,
  onClose,
}: {
  doc: SharedDocumentRow;
  onClose: () => void;
}) {
  const [exportingPdf, setExportingPdf] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    if (!printRef.current) return;
    setExportingPdf(true);
    downloadDocumentPdf(
      printRef.current,
      doc.title,
      () => setExportingPdf(false),
      () => {
        setExportingPdf(false);
        alert("Couldn't download that document as a PDF. Please try again.");
      },
    );
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
          <div ref={printRef} className="bg-white" style={{ width: "100%", maxWidth: 800 }}>
            <p className="text-xs text-gray-400 mb-4">
              Published {new Date(doc.published_at ?? doc.updated_at).toLocaleString()}
            </p>
            <div className="text-base text-gray-800 whitespace-pre-wrap leading-relaxed">
              {doc.content || " "}
            </div>
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

  const loadDocuments = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const data = await getMyPublishedDocuments(userId);
      setDocuments(data);
    } catch (err) {
      console.error("Failed to load shared documents:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Nothing to show and nothing loading - don't take up space on the
  // dashboard with an empty card for members who've never had one shared.
  if (!loading && documents.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="h-5 w-5 text-indigo-600" />
        <h3 className="font-semibold text-gray-900">Documents from Jody</h3>
      </div>
      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
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
