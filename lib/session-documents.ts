// Files attached to a mentoring session (stored in the private
// "session-documents" bucket, tracked in the session_documents table).
import { supabase } from "@/lib/supabase/client";

export interface SessionDocument {
  id: string;
  session_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  uploaded_by_name: string | null;
  created_at: string;
}

export const MAX_SESSION_DOC_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_EXTENSIONS = [
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
  "txt", "csv", "png", "jpg", "jpeg", "webp", "gif",
];

const db = supabase as any;

export async function listSessionDocuments(sessionId: string): Promise<SessionDocument[]> {
  const { data, error } = await db
    .from("session_documents")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SessionDocument[];
}

export function validateSessionFile(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return "That file type isn't supported. Use PDF, Word, Excel, PowerPoint, text, CSV or an image.";
  }
  if (file.size > MAX_SESSION_DOC_BYTES) {
    return "That file is larger than 10 MB. Please upload a smaller file.";
  }
  return null;
}

export async function uploadSessionDocument(
  sessionId: string,
  file: File,
  uploaderName: string,
): Promise<void> {
  const problem = validateSessionFile(file);
  if (problem) throw new Error(problem);

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not signed in");

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const path = `${sessionId}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("session-documents")
    .upload(path, file, { contentType: file.type || undefined });
  if (uploadError) throw uploadError;

  const { error: rowError } = await db.from("session_documents").insert({
    session_id: sessionId,
    file_name: file.name,
    file_path: path,
    file_size: file.size,
    mime_type: file.type || null,
    uploaded_by: auth.user.id,
    uploaded_by_name: uploaderName,
  });
  if (rowError) {
    // Don't leave an orphaned file behind if the record couldn't be saved.
    await supabase.storage.from("session-documents").remove([path]);
    throw rowError;
  }
}

export async function openSessionDocument(doc: SessionDocument): Promise<void> {
  const { data, error } = await supabase.storage
    .from("session-documents")
    .createSignedUrl(doc.file_path, 120, { download: doc.file_name });
  if (error || !data?.signedUrl) throw error ?? new Error("Couldn't open file");
  window.open(data.signedUrl, "_blank");
}

export async function deleteSessionDocument(doc: SessionDocument): Promise<void> {
  const { error } = await db.from("session_documents").delete().eq("id", doc.id);
  if (error) throw error;
  await supabase.storage.from("session-documents").remove([doc.file_path]);
}
