"use client";

import { useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning",
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const colors = {
    danger: {
      button: "bg-red-600 hover:bg-red-700",
      icon: "text-red-600",
      border: "border-red-200",
    },
    warning: {
      button: "bg-amber-600 hover:bg-amber-700",
      icon: "text-amber-600",
      border: "border-amber-200",
    },
    info: {
      button: "bg-blue-600 hover:bg-blue-700",
      icon: "text-blue-600",
      border: "border-blue-200",
    },
  };

  const color = colors[type];

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[10000]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div
        className={`relative max-w-md w-full mx-4 bg-white rounded-2xl shadow-2xl border ${color.border} animate-in`}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`p-2 rounded-full bg-${type === "danger" ? "red" : type === "warning" ? "amber" : "blue"}-100`}
            >
              <AlertTriangle className={`h-5 w-5 ${color.icon}`} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>

          <p className="text-gray-600 mb-6">{message}</p>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${color.button}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
