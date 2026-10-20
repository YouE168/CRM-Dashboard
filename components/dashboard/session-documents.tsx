"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Paperclip, Download, Trash2, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import {
  listSessionDocuments,
  uploadSessionDocument,
  openSessionDocument,
  deleteSessionDocument,
  type SessionDocument,
} from "@/lib/session-documents";

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Documents attached to one mentoring session. Mentors/admin can upload and
// remove; the mentee on the session can only view and download.
export function SessionDocuments({
  sessionId,
  canUpload,
}: {
  sessionId: string;
  canUpload: boolean;
}) {
  const [docs, setDocs] = useState<SessionDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myName, setMyName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      setDocs(await listSessionDocuments(sessionId));
    } catch (err) {
      console.error("Failed to load session documents:", err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setMyUserId(data.user.id);
      const { data: row } = await supabase
        .from("users")
        .select("name")
        .eq("id", data.user.id)
        .maybeSingle();
      setMyName(row?.name || data.user.email || "");
    });
  }, []);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadSessionDocument(sessionId, file, myName);
      }
      await load();
    } catch (err: any) {
      console.error("Upload failed:", err);
      setError(err?.message || "Couldn't upload that file. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  // Nothing to show a mentee, and nothing for them to upload.
  if (!canUpload && !loading && docs.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-gray-200/70">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
          <Paperclip className="h-3.5 w-3.5" />
          Documents{docs.length > 0 ? ` (${docs.length})` : ""}
        </div>
        {canUpload && (
          <>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.webp,.gif"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              {uploading ? "Uploading…" : "Attach document"}
            </button>
          </>
        )}
      </div>

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

      {loading ? (
        <p className="text-xs text-gray-400 mt-2">Loading…</p>
      ) : docs.length === 0 ? (
        <p className="text-xs text-gray-400 mt-2">
          No documents yet. PDF, Word, Excel or images up to 10 MB.
        </p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {docs.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between gap-2 bg-white rounded-lg border border-gray-100 px-2.5 py-1.5"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">{d.file_name}</p>
                <p className="text-[11px] text-gray-400">
                  {formatSize(d.file_size)}
                  {d.uploaded_by_name ? ` · ${d.uploaded_by_name}` : ""}
                  {" · "}
                  {new Date(d.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() =>
                    openSessionDocument(d).catch(() =>
                      setError("Couldn't open that file. Please try again."),
                    )
                  }
                  className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md"
                  title="Download"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                {canUpload && d.uploaded_by === myUserId && (
                  <button
                    onClick={async () => {
                      if (!window.confirm(`Delete "${d.file_name}"?`)) return;
                      try {
                        await deleteSessionDocument(d);
                        await load();
                      } catch {
                        setError("Couldn't delete that file. Please try again.");
                      }
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
