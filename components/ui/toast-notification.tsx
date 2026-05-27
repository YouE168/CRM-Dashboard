"use client";

import { useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastNotificationProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export function ToastNotification({
  message,
  type = "info",
  duration = 3000,
  onClose,
}: ToastNotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-600" />,
    error: <AlertCircle className="h-5 w-5 text-red-600" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-600" />,
    info: <Info className="h-5 w-5 text-blue-600" />,
  };

  const bgColors = {
    success: "bg-green-50 border-green-200",
    error: "bg-red-50 border-red-200",
    warning: "bg-amber-50 border-amber-200",
    info: "bg-white border-gray-200",
  };

  const textColors = {
    success: "text-green-800",
    error: "text-red-800",
    warning: "text-amber-800",
    info: "text-gray-800",
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative max-w-md w-full mx-4 p-5 rounded-xl shadow-2xl border ${bgColors[type]} animate-in`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">{icons[type]}</div>
          <div className="flex-1">
            <p
              className={`text-sm font-medium ${textColors[type]} leading-relaxed`}
            >
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
