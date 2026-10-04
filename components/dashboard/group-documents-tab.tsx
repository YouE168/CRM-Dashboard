"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FileText, Plus, X, Trash2, Download, Globe, Search, Users } from "lucide-react";
import {
  getGroupSharedDocuments,
  addGroupSharedDocument,
  updateSharedDocument,
  setSharedDocumentPublished,
  deleteSharedDocument,
  getRecipientsForDocument,
  setGroupDocumentRecipients,
  getRecipientOptions,
  type SharedDocumentRow,
  type SharedDocumentRecipientRow,
  type DocumentRecipientOption,
} from "@/lib/supabase/dashboard-data";
import { downloadNodeAsLetterPdf, DOCUMENT_PAGE_WIDTH } from "@/lib/document-pdf";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";

// "Group Documents" - a Shared Document (same Word-doc-style write-up as
// the per-person Documents panel on a member/business's own profile) that
// goes out to MULTIPLE recipients at once instead of just one - built for
// things like a big meeting with several people in it, where Jody writes
// one summary and shares it with everyone who attended.

const TYPE_LABELS: Record<string, string> = {
  mentee: "Mentees",
  entrepreneur: "Entrepreneurs",
  partner: "Partners",
  coalition: "Coalitions",
  business: "Businesses",
};

function GroupDocumentPage({
  title,
  content,
  meta,
}: {
  title: string;
  content: string;
  meta?: string;
}) {
  return (
    <div className="bg-white" style={{ width: 800, padding: 56 }}>
      <h1 className="text-3xl font-bold text-gray-900 mb-1">
        {title || "Untitled Document"}
      </h1>
      {meta && <p className="text-sm text-gray-400 mb-6">{meta}</p>}
      <div className="text-base text-gray-800 whitespace-pre-wrap leading-relaxed">
        {content || " "}
      </div>
    </div>
  );
}

function RecipientPicker({
  options,
  selected,
  onChange,
}: {
  options: DocumentRecipientOption[];
  selected: DocumentRecipientOption[];
  onChange: (next: DocumentRecipientOption[]) => void;
}) {
  const [q, setQ] = useState("");
  const selectedKeys = new Set(selected.map((r) => `${r.member_type}:${r.member_id}`));

  const toggle = (opt: DocumentRecipientOption) => {
    const key = `${opt.member_type}:${opt.member_id}`;
    if (selectedKeys.has(key)) {
      onChange(selected.filter((r) => `${r.member_type}:${r.member_id}` !== key));
    } else {
      onChange([...selected, opt]);
    }
  };

  const filtered = options.filter((o) =>
    o.member_name.toLowerCase().includes(q.toLowerCase()),
  );
  const grouped = filtered.reduce<Record<string, DocumentRecipientOption[]>>(
    (acc, o) => {
      (acc[o.member_type] ||= []).push(o);
      return acc;
    },
    {},
  );

  return (
    <div className="border border-gray-200 rounded-xl p-3">
      <div className="relative mb-2">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search people/businesses…"
          className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>
      <div className="max-h-56 overflow-y-auto space-y-3">
        {Object.keys(grouped).length === 0 ? (
          <p className="text-sm text-gray-400 py-2">No matches.</p>
        ) : (
          Object.entries(grouped).map(([type, opts]) => (
            <div key={type}>
              <p className="text-xs font-medium text-gray-400 uppercase mb-1">
                {TYPE_LABELS[type] || type}
              </p>
              <div className="space-y-1">
                {opts.map((o) => {
                  const key = `${o.member_type}:${o.member_id}`;
                  const checked = selectedKeys.has(key);
                  return (
                    <label
                      key={key}
                      className="flex items-center gap-2 text-sm px-2 py-1 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(o)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-400"
                      />
                      {o.member_name}
                    </label>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
          {selected.length} recipient{selected.length === 1 ? "" : "s"} selected
        </p>
      )}
    </div>
  );
}

function GroupDocumentEditorModal({
  authorName,
  recipientOptions,
  document,
  onClose,
  onSaved,
}: {
  authorName: string;
  recipientOptions: DocumentRecipientOption[];
  document: SharedDocumentRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(document?.title ?? "");
  const [content, setContent] = useState(document?.content ?? "");
  const [docId, setDocId] = useState<string | null>(document?.id ?? null);
  const [status, setStatus] = useState<"draft" | "published">(
    (document?.status as "draft" | "published") ?? "draft",
  );
  const [recipients, setRecipients] = useState<DocumentRecipientOption[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(!!document);
  const [saving, setSaving] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [pendingPublishChange, setPendingPublishChange] = useState<
    "publish" | "unpublish" | null
  >(null);
  const [pendingDelete, setPendingDelete] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!document) {
      setLoadingRecipients(false);
      return;
    }
    getRecipientsForDocument(document.id)
      .then((rows: SharedDocumentRecipientRow[]) =>
        setRecipients(
          rows.map((r) => ({
            member_type: r.member_type,
            member_id: r.member_id,
            member_name: r.member_name,
          })),
        ),
      )
      .catch((err) => console.error("Failed to load document recipients:", err))
      .finally(() => setLoadingRecipients(false));
  }, [document]);

  const saveContent = async (): Promise<string | null> => {
    if (!title.trim()) {
      alert("Give the document a title first.");
      return null;
    }
    if (recipients.length === 0) {
      alert("Pick at least one recipient for this document.");
      return null;
    }
    if (docId) {
      await updateSharedDocument(docId, { title, content });
      await setGroupDocumentRecipients(docId, recipients);
      return docId;
    }
    const created = await addGroupSharedDocument(title, content, authorName, recipients);
    setDocId(created.id);
    return created.id;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const id = await saveContent();
      if (!id) return;
      onSaved();
    } catch (err) {
      console.error("Failed to save group document:", err);
      alert("Couldn't save that document. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const confirmTogglePublish = async () => {
    if (!pendingPublishChange) return;
    setSaving(true);
    try {
      const id = await saveContent();
      if (!id) return;
      const publish = pendingPublishChange === "publish";
      await setSharedDocumentPublished(id, publish);
      setStatus(publish ? "published" : "draft");
      setPendingPublishChange(null);
      onSaved();
    } catch (err) {
      console.error("Failed to update document status:", err);
      alert("Couldn't update that document. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!docId) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      await deleteSharedDocument(docId);
      setPendingDelete(false);
      onSaved();
    } catch (err) {
      console.error("Failed to delete document:", err);
      alert("Couldn't delete that document. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    setExportingPdf(true);
    try {
      const slug = (title || "document").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await downloadNodeAsLetterPdf(printRef.current, `${slug}.pdf`);
    } catch (err) {
      console.error("Failed to export document to PDF:", err);
      alert("Couldn't download that document as a PDF. Please try again.");
    } finally {
      setExportingPdf(false);
    }
  };

  const recipientNames = recipients.map((r) => r.member_name).join(", ");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-5 border-b border-gray-100 flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {docId ? "Edit Group Document" : "New Group Document"}
            </h2>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                status === "published"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {status === "published" ? "Published" : "Draft"}
            </span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-400">
            {status === "published"
              ? `Visible to everyone listed below on their own dashboard - download or unpublish below.`
              : `Only Jody/staff can see this until it's published to the recipients below.`}
          </p>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Document title"
            className="w-full text-2xl font-bold border-0 border-b border-gray-200 pb-2 focus:outline-none focus:border-indigo-400 placeholder:text-gray-300"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write the meeting summary, plan, or anything else you want to document here..."
            rows={14}
            className="w-full border border-gray-200 rounded-xl p-4 text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y"
          />
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1.5">Share with</p>
            {loadingRecipients ? (
              <p className="text-sm text-gray-400">Loading recipients…</p>
            ) : (
              <RecipientPicker
                options={recipientOptions}
                selected={recipients}
                onChange={setRecipients}
              />
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white p-5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={() => setPendingDelete(true)}
            className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-1.5"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={exportingPdf}
              className="px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {exportingPdf ? "Exporting…" : "Download PDF"}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-2 text-sm text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl font-medium disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() =>
                setPendingPublishChange(status === "published" ? "unpublish" : "publish")
              }
              disabled={saving}
              className={`px-3 py-2 text-sm rounded-xl font-medium flex items-center gap-1.5 disabled:opacity-50 ${
                status === "published"
                  ? "text-red-600 bg-red-50 hover:bg-red-100"
                  : "text-white bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              <Globe className="h-4 w-4" />
              {status === "published" ? "Unpublish" : "Publish"}
            </button>
          </div>
        </div>
      </div>

      <div style={{ position: "fixed", top: 0, left: -99999, width: DOCUMENT_PAGE_WIDTH }}>
        <div ref={printRef}>
          <GroupDocumentPage
            title={title}
            content={content}
            meta={
              recipientNames
                ? `Prepared for ${recipientNames} by ${authorName}`
                : `Prepared by ${authorName}`
            }
          />
        </div>
      </div>

      <ConfirmationModal
        isOpen={pendingPublishChange !== null}
        title={pendingPublishChange === "publish" ? "Publish document" : "Unpublish document"}
        message={
          pendingPublishChange === "publish"
            ? `Publish this document to all ${recipients.length} selected recipient${recipients.length === 1 ? "" : "s"}? They'll each be able to view and download it from their own dashboard right away.`
            : `Unpublish this document? None of the recipients will be able to see or download it anymore.`
        }
        confirmText={saving ? "Saving…" : pendingPublishChange === "publish" ? "Publish" : "Unpublish"}
        cancelText="Cancel"
        type={pendingPublishChange === "publish" ? "info" : "danger"}
        onConfirm={confirmTogglePublish}
        onCancel={() => setPendingPublishChange(null)}
      />
      <ConfirmationModal
        isOpen={pendingDelete}
        title="Delete document"
        message="Delete this document? This can't be undone, and it will disappear from every recipient's dashboard if it was published."
        confirmText={saving ? "Deleting…" : "Delete"}
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(false)}
      />
    </div>
  );
}

export function GroupDocumentsTab({ authorName }: { authorName: string }) {
  const [documents, setDocuments] = useState<SharedDocumentRow[]>([]);
  const [recipientCounts, setRecipientCounts] = useState<Record<string, number>>({});
  const [recipientOptions, setRecipientOptions] = useState<DocumentRecipientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDoc, setEditingDoc] = useState<SharedDocumentRow | "new" | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      const [docs, options] = await Promise.all([
        getGroupSharedDocuments(),
        getRecipientOptions(),
      ]);
      setDocuments(docs);
      setRecipientOptions(options);
      const counts: Record<string, number> = {};
      await Promise.all(
        docs.map(async (doc) => {
          const recipients = await getRecipientsForDocument(doc.id);
          counts[doc.id] = recipients.length;
        }),
      );
      setRecipientCounts(counts);
    } catch (err) {
      console.error("Failed to load group documents:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
            Group Documents
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Write one document and share it with multiple members/businesses
            at once - built for notes from a meeting with several people in
            it.
          </p>
        </div>
        <button
          onClick={() => setEditingDoc("new")}
          className="shrink-0 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          New Document
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading documents…</p>
      ) : documents.length === 0 ? (
        <p className="text-sm text-gray-400">
          No group documents yet - write one and pick who should see it.
        </p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setEditingDoc(doc)}
              className="w-full text-left bg-white border border-gray-100 shadow-sm hover:bg-gray-50 rounded-xl p-4 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-gray-900 truncate flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
                  {doc.title}
                </p>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                    doc.status === "published"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {doc.status === "published" ? "Published" : "Draft"}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {recipientCounts[doc.id] ?? 0} recipient
                {(recipientCounts[doc.id] ?? 0) === 1 ? "" : "s"} · Updated{" "}
                {new Date(doc.updated_at).toLocaleString()}
              </p>
            </button>
          ))}
        </div>
      )}

      {editingDoc && (
        <GroupDocumentEditorModal
          authorName={authorName}
          recipientOptions={recipientOptions}
          document={editingDoc === "new" ? null : editingDoc}
          onClose={() => setEditingDoc(null)}
          onSaved={() => {
            setEditingDoc(null);
            loadDocuments();
          }}
        />
      )}
    </div>
  );
}
