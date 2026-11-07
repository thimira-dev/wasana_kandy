"use client";

import React, { useState, useEffect, useRef } from "react";
import { AlertTriangle, X, Trash2 } from "lucide-react";

interface DeleteProductModalProps {
  productId: string;
  productName: string;
  catalogueCode?: string | null;
  onClose: () => void;
  onDeleted?: () => void;
}

/**
 * Supabase-style destructive confirmation flow:
 * 1. Red warning banner stating the action is permanent
 * 2. Type-to-confirm input that must EXACTLY match the cake name (case-sensitive)
 * 3. Final red button stays disabled until the input matches
 * 4. Esc / outside click / X all cancel safely without deleting
 */
export function DeleteProductModal({
  productId,
  productName,
  catalogueCode,
  onClose,
  onDeleted,
}: DeleteProductModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose, isDeleting]);

  const isMatch = confirmText === productName;
  const canSubmit = isMatch && !isDeleting;

  const handleDelete = async () => {
    if (!canSubmit) return;
    setError(null);
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete cake");
      }
      setShowToast(true);
      setTimeout(() => {
        onDeleted?.();
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete cake");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4"
        onClick={() => {
          if (!isDeleting) onClose();
        }}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-lg w-full p-7 space-y-5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Title + close */}
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-bold text-stone-900 leading-snug">
              Confirm deletion of{" "}
              <span className="text-rose-700">{productName}</span>
              {catalogueCode ? (
                <span className="ml-2 font-mono text-sm text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-md border border-amber-200 align-middle">
                  {catalogueCode}
                </span>
              ) : null}
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer disabled:opacity-40"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Red warning banner */}
          <div className="rounded-xl border border-rose-300 bg-rose-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-rose-900">
                  This action cannot be undone. This will permanently delete the {productName} cake and all of its data.
                </p>
                <p className="text-xs text-rose-700 mt-1.5">
                  Its photos and customization options are removed as well. Past orders are kept —
                  they store their own copy of the cake details.
                </p>
              </div>
            </div>
          </div>

          {/* Type-to-confirm */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-800 block" htmlFor="delete-confirm-input">
              Type <span className="font-mono text-stone-900">{productName}</span> to confirm.
            </label>
            <input
              id="delete-confirm-input"
              ref={inputRef}
              type="text"
              value={confirmText}
              disabled={isDeleting}
              onChange={(e) => setConfirmText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canSubmit) {
                  e.preventDefault();
                  handleDelete();
                }
              }}
              placeholder={productName}
              spellCheck={false}
              autoComplete="off"
              className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg focus:outline-hidden focus:ring-2 transition-colors ${
                confirmText.length === 0
                  ? "border-stone-300 focus:ring-amber-500"
                  : isMatch
                  ? "border-emerald-400 focus:ring-emerald-500"
                  : "border-rose-300 focus:ring-rose-500"
              }`}
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Final delete button */}
          <button
            type="button"
            onClick={handleDelete}
            disabled={!canSubmit}
            className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold rounded-lg transition-colors ${
              canSubmit
                ? "bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
                : "bg-rose-600/40 text-white cursor-not-allowed"
            }`}
          >
            {isDeleting ? (
              <span>Deleting &ldquo;{productName}&rdquo;...</span>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                I understand, delete this cake
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-stone-900 text-white px-4 py-3 rounded-xl shadow-xl border border-stone-700">
          <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <div>
            <p className="text-xs font-bold">Cake deleted</p>
            <p className="text-[11px] text-stone-300">&ldquo;{productName}&rdquo; has been permanently removed.</p>
          </div>
        </div>
      )}
    </>
  );
}
