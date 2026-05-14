"use client";

import { X, ChevronLeft } from "lucide-react";

export function SlidePanel({
  open,
  onClose,
  title,
  icon: Icon,
  children,
  onBack,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  onBack?: () => void;
}) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      )}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-white shadow-xl z-50 transition-transform duration-300 flex flex-col ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-gray-800 font-semibold">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="mr-1 text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <Icon className="h-5 w-5 text-emerald-600" />
            {title}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 rounded-full p-1 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </>
  );
}
