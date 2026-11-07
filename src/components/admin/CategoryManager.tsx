"use client";

import React, { useState } from "react";
import {
  Tag, Layers, Plus, Pencil, Trash2, X, Check, AlertCircle,
  CheckCircle2, Sparkles, ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export interface AdminCategoryRow {
  id: string;
  name: string;
  productCount: number;
}

export interface AdminCollectionRow {
  id: string;
  code: string;
  name: string;
  isSeasonal: boolean;
  productCount: number;
}

interface CategoryManagerProps {
  initialCategories: AdminCategoryRow[];
  initialCollections: AdminCollectionRow[];
}

interface ConfirmState {
  type: "category" | "collection";
  id: string;
  label: string;
  productCount: number;
}

export function CategoryManager({ initialCategories, initialCollections }: CategoryManagerProps) {
  const [tab, setTab] = useState<"categories" | "collections">("categories");
  const [categories, setCategories] = useState<AdminCategoryRow[]>(initialCategories);
  const [collections, setCollections] = useState<AdminCollectionRow[]>(initialCollections);

  const [confirmDelete, setConfirmDelete] = useState<ConfirmState | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const flash = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-serif font-bold text-stone-900">
              Categories &amp; Collections
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Manage the dropdown lists used when classifying cakes in the catalogue.
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {actionError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-sm">{actionError}</p>
        </div>
      )}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="font-semibold text-sm">{actionSuccess}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-stone-100 rounded-xl p-1 w-fit">
        <button
          type="button"
          onClick={() => setTab("categories")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            tab === "categories" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500 hover:text-stone-800"
          }`}
        >
          <Tag className="w-4 h-4" />
          Cake Categories ({categories.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("collections")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            tab === "collections" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500 hover:text-stone-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          Collection Codes ({collections.length})
        </button>
      </div>

      {tab === "categories" ? (
        <CategoriesTab
          categories={categories}
          setCategories={setCategories}
          onConfirmDelete={(row) =>
            setConfirmDelete({ type: "category", id: row.id, label: row.name, productCount: row.productCount })
          }
          flash={flash}
          setActionError={setActionError}
          isBusy={isBusy}
          setIsBusy={setIsBusy}
        />
      ) : (
        <CollectionsTab
          collections={collections}
          setCollections={setCollections}
          onConfirmDelete={(row) =>
            setConfirmDelete({ type: "collection", id: row.id, label: `${row.code} — ${row.name}`, productCount: row.productCount })
          }
          flash={flash}
          setActionError={setActionError}
          isBusy={isBusy}
          setIsBusy={setIsBusy}
        />
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <DeleteConfirmModal
          confirm={confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onDeleted={() => {
            setConfirmDelete(null);
          }}
          setCategories={setCategories}
          setCollections={setCollections}
          setActionError={setActionError}
          flash={flash}
          isBusy={isBusy}
          setIsBusy={setIsBusy}
        />
      )}
    </div>
  );
}

/* ──────────────────────────── CATEGORIES TAB ──────────────────────────── */

function CategoriesTab({
  categories,
  setCategories,
  onConfirmDelete,
  flash,
  setActionError,
  isBusy,
  setIsBusy,
}: {
  categories: AdminCategoryRow[];
  setCategories: React.Dispatch<React.SetStateAction<AdminCategoryRow[]>>;
  onConfirmDelete: (row: { id: string; name: string; productCount: number }) => void;
  flash: (msg: string) => void;
  setActionError: (msg: string | null) => void;
  isBusy: boolean;
  setIsBusy: (v: boolean) => void;
}) {
  const [newName, setNewName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setIsBusy(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.details?.fieldErrors) {
          const firstErr = Object.values(data.details.fieldErrors).flat()[0] as string;
          throw new Error(firstErr || data.error);
        }
        throw new Error(data.error || "Failed to create category");
      }
      setCategories((prev) => [...prev, data.category]);
      setNewName("");
      flash(`Category "${data.category.name}" created.`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setIsBusy(false);
    }
  };

  const handleRename = async (id: string) => {
    setActionError(null);
    if (!editName.trim()) return;
    setIsBusy(true);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to rename category");
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name: data.category.name } : c)));
      setEditingId(null);
      flash(`Category renamed to "${data.category.name}". Assigned cakes updated.`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to rename category");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Create form */}
      <form
        onSubmit={handleCreate}
        className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs"
      >
        <h2 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-amber-600" />
          Add New Cake Category
        </h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            required
            minLength={2}
            maxLength={60}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Wedding Cakes, Birthday Cakes..."
            className="flex-1 px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
          />
          <button
            type="submit"
            disabled={isBusy}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Category
          </button>
        </div>
        {createError && (
          <p className="text-xs text-rose-700 mt-2 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" /> {createError}
          </p>
        )}
      </form>

      {/* List */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        {categories.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-stone-700">No categories yet</p>
            <p className="text-xs text-stone-500 mt-1">Create your first category above.</p>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {categories.map((cat) => (
              <li key={cat.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-stone-50/70">
                <span className="w-9 h-9 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0">
                  <Tag className="w-4 h-4 text-stone-500" />
                </span>
                {editingId === cat.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      autoFocus
                      required
                      maxLength={60}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(cat.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="flex-1 px-3 py-1.5 text-sm bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => handleRename(cat.id)}
                      disabled={isBusy}
                      className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="p-1.5 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-bold text-stone-900">{cat.name}</span>
                    <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                      {cat.productCount} cake{cat.productCount !== 1 ? "s" : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setEditingId(cat.id); setEditName(cat.name); setActionError(null); }}
                      disabled={isBusy}
                      className="p-2 rounded-lg text-stone-500 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer disabled:opacity-50"
                      title="Rename"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => { onConfirmDelete(cat); setActionError(null); }}
                      disabled={isBusy}
                      className="p-2 rounded-lg text-stone-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── COLLECTIONS TAB ─────────────────────────── */

function CollectionsTab({
  collections,
  setCollections,
  onConfirmDelete,
  flash,
  setActionError,
  isBusy,
  setIsBusy,
}: {
  collections: AdminCollectionRow[];
  setCollections: React.Dispatch<React.SetStateAction<AdminCollectionRow[]>>;
  onConfirmDelete: (row: AdminCollectionRow) => void;
  flash: (msg: string) => void;
  setActionError: (msg: string | null) => void;
  isBusy: boolean;
  setIsBusy: (v: boolean) => void;
}) {
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newSeasonal, setNewSeasonal] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState("");
  const [editName, setEditName] = useState("");
  const [editSeasonal, setEditSeasonal] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setIsBusy(true);
    try {
      const res = await fetch("/api/admin/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: newCode.trim(), name: newName.trim(), isSeasonal: newSeasonal }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.details?.fieldErrors) {
          const firstErr = Object.values(data.details.fieldErrors).flat()[0] as string;
          throw new Error(firstErr || data.error);
        }
        throw new Error(data.error || "Failed to create collection");
      }
      setCollections((prev) => [...prev, data.collection]);
      setNewCode("");
      setNewName("");
      setNewSeasonal(false);
      flash(`Collection "${data.collection.code}" created.`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create collection");
    } finally {
      setIsBusy(false);
    }
  };

  const handleUpdate = async (id: string) => {
    setActionError(null);
    if (!editCode.trim() || !editName.trim()) return;
    setIsBusy(true);
    try {
      const res = await fetch(`/api/admin/collections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: editCode.trim(), name: editName.trim(), isSeasonal: editSeasonal }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.details?.fieldErrors) {
          const firstErr = Object.values(data.details.fieldErrors).flat()[0] as string;
          throw new Error(firstErr || data.error);
        }
        throw new Error(data.error || "Failed to update collection");
      }
      setCollections((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, code: data.collection.code, name: data.collection.name, isSeasonal: data.collection.isSeasonal }
            : c
        )
      );
      setEditingId(null);
      flash(`Collection "${data.collection.code}" updated. Assigned cakes updated.`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update collection");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Create form */}
      <form
        onSubmit={handleCreate}
        className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs"
      >
        <h2 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-amber-600" />
          Add New Collection Code
        </h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            required
            maxLength={4}
            pattern="[A-Za-z]+"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
            placeholder="Code e.g. GD"
            className="w-full sm:w-32 px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono uppercase"
          />
          <input
            type="text"
            required
            minLength={2}
            maxLength={80}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Full name e.g. Garden Delight Collection"
            className="flex-1 px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
          />
          <label className="flex items-center gap-2 cursor-pointer shrink-0 px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg">
            <input
              type="checkbox"
              checked={newSeasonal}
              onChange={(e) => setNewSeasonal(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded-sm border-stone-300 focus:ring-amber-500"
            />
            <Sparkles className="w-4 h-4 text-rose-600" />
            <span className="text-xs font-semibold text-stone-800">Seasonal</span>
          </label>
          <button
            type="submit"
            disabled={isBusy}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        </div>
        {createError && (
          <p className="text-xs text-rose-700 mt-2 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" /> {createError}
          </p>
        )}
      </form>

      {/* List */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        {collections.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-stone-700">No collections yet</p>
            <p className="text-xs text-stone-500 mt-1">Create your first collection code above.</p>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {collections.map((col) => (
              <li key={col.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-stone-50/70">
                <span className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 font-mono text-xs font-bold text-amber-900">
                  {col.code}
                </span>
                {editingId === col.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editCode}
                      autoFocus
                      required
                      maxLength={4}
                      pattern="[A-Za-z]+"
                      onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                      className="w-20 px-2.5 py-1.5 text-sm bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono uppercase"
                    />
                    <input
                      type="text"
                      value={editName}
                      required
                      maxLength={80}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-sm bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                    <label className="flex items-center gap-1.5 cursor-pointer" title="Seasonal collection">
                      <input
                        type="checkbox"
                        checked={editSeasonal}
                        onChange={(e) => setEditSeasonal(e.target.checked)}
                        className="w-4 h-4 text-amber-600 rounded-sm border-stone-300 focus:ring-amber-500"
                      />
                      <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                    </label>
                    <button
                      type="button"
                      onClick={() => handleUpdate(col.id)}
                      disabled={isBusy}
                      className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="p-1.5 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold text-stone-900 block truncate">{col.name}</span>
                    </div>
                    {col.isSeasonal && (
                      <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        Seasonal
                      </span>
                    )}
                    <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                      {col.productCount} cake{col.productCount !== 1 ? "s" : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(col.id);
                        setEditCode(col.code);
                        setEditName(col.name);
                        setEditSeasonal(col.isSeasonal);
                        setActionError(null);
                      }}
                      disabled={isBusy}
                      className="p-2 rounded-lg text-stone-500 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer disabled:opacity-50"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => { onConfirmDelete(col); setActionError(null); }}
                      disabled={isBusy}
                      className="p-2 rounded-lg text-stone-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────── DELETE MODAL ──────────────────────────── */

function DeleteConfirmModal({
  confirm,
  onClose,
  onDeleted,
  setCategories,
  setCollections,
  setActionError,
  flash,
  isBusy,
  setIsBusy,
}: {
  confirm: ConfirmState;
  onClose: () => void;
  onDeleted: () => void;
  setCategories: React.Dispatch<React.SetStateAction<AdminCategoryRow[]>>;
  setCollections: React.Dispatch<React.SetStateAction<AdminCollectionRow[]>>;
  setActionError: (msg: string | null) => void;
  flash: (msg: string) => void;
  isBusy: boolean;
  setIsBusy: (v: boolean) => void;
}) {
  const isCategory = confirm.type === "category";
  const endpoint = isCategory
    ? `/api/admin/categories/${confirm.id}`
    : `/api/admin/collections/${confirm.id}`;

  const handleDelete = async () => {
    setActionError(null);
    setIsBusy(true);
    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      if (isCategory) {
        setCategories((prev) => prev.filter((c) => c.id !== confirm.id));
      } else {
        setCollections((prev) => prev.filter((c) => c.id !== confirm.id));
      }
      const unassigned = data.deleted?.unassignedCakes ?? 0;
      flash(
        unassigned > 0
          ? `"${confirm.label}" deleted. ${unassigned} cake${unassigned !== 1 ? "s" : ""} unassigned.`
          : `"${confirm.label}" deleted.`
      );
      onDeleted();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete");
      onDeleted();
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-md w-full p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-rose-600" />
            </span>
            <h3 className="text-base font-bold text-stone-900">
              Delete {isCategory ? "Category" : "Collection"}?
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-stone-600 leading-relaxed">
          You are about to delete{" "}
          <span className="font-bold text-stone-900">&ldquo;{confirm.label}&rdquo;</span>.
          {confirm.productCount > 0 && (
            <span>
              {" "}{confirm.productCount} cake{confirm.productCount !== 1 ? "s" : ""} currently{" "}
              {confirm.productCount === 1 ? "uses" : "use"} this {isCategory ? "category" : "collection"} —
              they will <span className="font-semibold text-stone-800">not be deleted</span>, just
              unassigned.
            </span>
          )}
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isBusy}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            {isBusy ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
