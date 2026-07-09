// components/documents/document-share.tsx
"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  Plus,
  Lock,
  Unlock,
} from "lucide-react";

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  sharedWith: string[];
  signed: boolean;
  signedBy?: string;
  signedAt?: string;
}

interface DocumentShareProps {
  userEmail: string;
  userRole: "mentor" | "entrepreneur" | "mentee";
  partnerEmail?: string;
}

export function DocumentShare({
  userEmail,
  userRole,
  partnerEmail,
}: DocumentShareProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [newDocumentName, setNewDocumentName] = useState("");
  const [newDocumentFile, setNewDocumentFile] = useState<File | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(`documents_${userEmail}`);
    if (stored) {
      setDocuments(JSON.parse(stored));
    } else {
      // Sample documents
      const sampleDocs: Document[] = [
        {
          id: "doc-1",
          name: "Mentorship Agreement.pdf",
          type: "pdf",
          size: "245 KB",
          uploadedBy: "Jody Program",
          uploadedAt: new Date().toISOString(),
          sharedWith: [userEmail, partnerEmail || ""],
          signed: false,
        },
        {
          id: "doc-2",
          name: "Program Waiver.docx",
          type: "docx",
          size: "120 KB",
          uploadedBy: "Mentor",
          uploadedAt: new Date(
            Date.now() - 3 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          sharedWith: [userEmail, partnerEmail || ""],
          signed: true,
          signedBy: "John Doe",
          signedAt: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
      ];
      setDocuments(sampleDocs);
      localStorage.setItem(
        `documents_${userEmail}`,
        JSON.stringify(sampleDocs),
      );
    }
  }, [userEmail]);

  const saveDocuments = (updatedDocs: Document[]) => {
    setDocuments(updatedDocs);
    localStorage.setItem(`documents_${userEmail}`, JSON.stringify(updatedDocs));
  };

  const handleUpload = () => {
    if (!newDocumentName || !newDocumentFile) return;

    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      name: newDocumentName,
      type: newDocumentFile.name.split(".").pop() || "file",
      size: `${Math.round(newDocumentFile.size / 1024)} KB`,
      uploadedBy: userRole === "mentor" ? "Mentor" : "Entrepreneur",
      uploadedAt: new Date().toISOString(),
      sharedWith: [userEmail, partnerEmail || ""],
      signed: false,
    };

    const updated = [newDoc, ...documents];
    saveDocuments(updated);
    setShowUpload(false);
    setNewDocumentName("");
    setNewDocumentFile(null);
  };

  const handleSign = (docId: string) => {
    const updated = documents.map((doc) =>
      doc.id === docId
        ? {
            ...doc,
            signed: true,
            signedBy: userEmail,
            signedAt: new Date().toISOString(),
          }
        : doc,
    );
    saveDocuments(updated);
  };

  const handleDelete = (docId: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      const updated = documents.filter((doc) => doc.id !== docId);
      saveDocuments(updated);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return "📄";
      case "docx":
      case "doc":
        return "📝";
      case "xlsx":
      case "xls":
        return "📊";
      default:
        return "📎";
    }
  };

  const getRoleColor = (role: string) => {
    return role === "Mentor"
      ? "bg-blue-100 text-blue-700"
      : "bg-emerald-100 text-emerald-700";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">
            📄 Essential Documents
          </h3>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
            {documents.filter((d) => !d.signed).length} pending
          </span>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center gap-1"
        >
          <Plus className="h-3 w-3" />
          Upload Document
        </button>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Document Name
              </label>
              <input
                type="text"
                value={newDocumentName}
                onChange={(e) => setNewDocumentName(e.target.value)}
                placeholder="e.g., Mentorship Agreement.pdf"
                className="w-full px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                File
              </label>
              <input
                type="file"
                onChange={(e) =>
                  setNewDocumentFile(e.target.files?.[0] || null)
                }
                className="w-full text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleUpload}
                disabled={!newDocumentName || !newDocumentFile}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                <Upload className="h-3 w-3 inline mr-1" />
                Upload
              </button>
              <button
                onClick={() => setShowUpload(false)}
                className="px-4 py-1.5 border rounded-lg text-sm hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document List */}
      <div className="divide-y divide-gray-100">
        {documents.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No documents shared yet</p>
            <p className="text-xs mt-1">Upload contracts and agreements here</p>
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="p-4 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-2xl">{getFileIcon(doc.type)}</div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-gray-400">
                        {doc.size} • Uploaded by{" "}
                        <span className="font-medium">{doc.uploadedBy}</span>
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(
                          doc.uploadedBy,
                        )}`}
                      >
                        {doc.uploadedBy}
                      </span>
                      {doc.signed ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          ✅ Signed by {doc.signedBy}
                        </span>
                      ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                          ⏳ Awaiting Signature
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Shared: {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!doc.signed && doc.uploadedBy !== userRole && (
                    <button
                      onClick={() => handleSign(doc.id)}
                      className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                      title="Sign Document"
                    >
                      ✍️
                    </button>
                  )}
                  <button
                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                    title="View Document"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  {doc.uploadedBy === userRole && (
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="h-3 w-3" />
          Securely shared between you and your mentor
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
            {documents.filter((d) => !d.signed).length} unsigned
          </span>
          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">
            {documents.filter((d) => d.signed).length} signed
          </span>
        </div>
      </div>
    </div>
  );
}
