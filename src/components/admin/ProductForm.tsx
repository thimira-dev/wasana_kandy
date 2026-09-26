"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { ImageUploader } from "./ImageUploader";
import { CustomizationGroupEditor } from "./CustomizationGroupEditor";
import { ProductInput, ProductImageInput, CustomizationGroupInput } from "@/lib/domain/validation";
import { ProductService } from "@/lib/services/product-service";
import { KNOWN_COLLECTIONS, MAIN_CATEGORIES, generateCatalogueCode } from "@/lib/domain/catalogue";

interface ProductFormProps {
  initialData?: {
    id?: string;
    name: string;
    slug: string;
    mainCategory?: string | null;
    collectionCode?: string | null;
    designNumber?: number | null;
    catalogueCode?: string | null;
    isSeasonal?: boolean;
    shortDescription?: string | null;
    description: string;
    basePrice: string | number;
    published: boolean;
    isActive: boolean;
    images: ProductImageInput[];
    customizationGroups: CustomizationGroupInput[];
  };
  isEditing?: boolean;
}

export function ProductForm({ initialData, isEditing = false }: ProductFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [autoSlug, setAutoSlug] = useState(!initialData?.slug);
  const [mainCategory, setMainCategory] = useState(initialData?.mainCategory || "");
  const [collectionCode, setCollectionCode] = useState(initialData?.collectionCode || "");
  const [designNumber, setDesignNumber] = useState(initialData?.designNumber?.toString() || "");
  const [isSeasonal, setIsSeasonal] = useState(initialData?.isSeasonal ?? false);
  const [shortDescription, setShortDescription] = useState(initialData?.shortDescription || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [basePrice, setBasePrice] = useState(initialData?.basePrice?.toString() || "");
  const [published, setPublished] = useState(initialData?.published ?? false);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [images, setImages] = useState<ProductImageInput[]>(initialData?.images || []);
  const [customizationGroups, setCustomizationGroups] = useState<CustomizationGroupInput[]>(
    initialData?.customizationGroups || []
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  // Live preview of canonical catalogue code (e.g. G-43, G-01)
  const previewCode = useMemo(() => {
    if (!collectionCode || !designNumber) return "";
    return generateCatalogueCode(collectionCode, designNumber);
  }, [collectionCode, designNumber]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (autoSlug) {
      if (val.trim()) {
        setSlug(ProductService.generateSlug(val));
      } else if (previewCode) {
        setSlug(ProductService.generateSlug(previewCode));
      }
    }
  };

  const handleCollectionChange = (val: string) => {
    setCollectionCode(val);
    // Check if collection is seasonal
    const matchedCol = KNOWN_COLLECTIONS.find((c) => c.code === val);
    if (matchedCol?.isSeasonal) {
      setIsSeasonal(true);
    }
    if (autoSlug && !name.trim()) {
      const code = generateCatalogueCode(val, designNumber);
      if (code) setSlug(ProductService.generateSlug(code));
    }
  };

  const handleDesignNumberChange = (val: string) => {
    setDesignNumber(val);
    if (autoSlug && !name.trim()) {
      const code = generateCatalogueCode(collectionCode, val);
      if (code) setSlug(ProductService.generateSlug(code));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(false);

    try {
      const parsedDesignNumber = designNumber.trim() ? parseInt(designNumber.trim(), 10) : null;

      const payload: ProductInput = {
        name: name.trim() || null,
        slug: slug.trim() || null,
        mainCategory: mainCategory.trim() || null,
        collectionCode: collectionCode.trim().toUpperCase() || null,
        designNumber: parsedDesignNumber,
        catalogueCode: previewCode || null,
        isSeasonal,
        shortDescription: shortDescription.trim() || null,
        description: description.trim(),
        basePrice: parseFloat(basePrice) || 0,
        published,
        isActive,
        images,
        customizationGroups,
      };

      const url = isEditing && initialData?.id
        ? `/api/admin/products/${initialData.id}`
        : "/api/admin/products";

      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details?.fieldErrors) {
          const firstErr = Object.values(data.details.fieldErrors).flat()[0] as string;
          throw new Error(firstErr || data.error || "Validation error");
        }
        throw new Error(data.error || "Failed to save cake");
      }

      setFormSuccess(true);
      setTimeout(() => {
        router.push("/admin/products");
        router.refresh();
      }, 700);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save cake");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
              {isEditing ? `Edit Cake: ${name || "Untitled"}` : "Create New Cake"}
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Fill in cake details, set the starting price, upload photos, and configure customer options.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-lg bg-amber-600 text-white hover:bg-amber-700 active:scale-98 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Save Cake"}</span>
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {formError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-900">Unable to save cake</p>
            <p className="text-xs text-rose-700 mt-0.5">{formError}</p>
          </div>
        </div>
      )}

      {formSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="font-semibold text-emerald-900">Cake saved successfully! Redirecting...</p>
        </div>
      )}

      {/* Basic Cake Details Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-3">
          Wasana Catalogue Classification
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Main Category */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              Main Cake Category
            </label>
            <select
              value={mainCategory}
              onChange={(e) => setMainCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            >
              <option value="">Select Main Category (Optional)</option>
              {MAIN_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-stone-400 mt-1">
              Used for category navigation and public catalogue filtering.
            </p>
          </div>

          {/* Collection Code */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              Collection Code
            </label>
            <select
              value={collectionCode}
              onChange={(e) => handleCollectionChange(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            >
              <option value="">Select Collection (e.g. G, M, ND, S)</option>
              {KNOWN_COLLECTIONS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.displayName}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-stone-400 mt-1">
              Collection letter code as printed in Wasana's physical catalogue.
            </p>
          </div>

          {/* Design Number inside Collection */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              Design Number
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={designNumber}
              onChange={(e) => handleDesignNumberChange(e.target.value)}
              placeholder="e.g. 43, 14, 1"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              Numerical design index (e.g. 43 for G-43, 1 for G-01).
            </p>
          </div>

          {/* Live Code Preview Card */}
          <div className="flex flex-col justify-center">
            <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="text-[11px] font-semibold text-stone-600 block uppercase tracking-wide">
                  Canonical Catalogue Code Preview:
                </span>
                <span className="font-mono text-base font-bold text-amber-900 block">
                  {previewCode ? previewCode : "— (Fill collection & design #)"}
                </span>
              </div>
            </div>
            {previewCode && (
              <span className="text-[10px] text-stone-400 mt-1 pl-1">
                Zero-padded format matching Wasana's physical catalogue.
              </span>
            )}
          </div>

          {/* Seasonal Special Checkbox */}
          <div className="sm:col-span-2 pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isSeasonal}
                onChange={(e) => setIsSeasonal(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded-sm border-stone-300 focus:ring-amber-500"
              />
              <div>
                <span className="text-xs font-bold text-stone-900 block">
                  Seasonal / Holiday Special Cake
                </span>
                <span className="text-[11px] text-stone-500 block">
                  Mark as seasonal (e.g. New Year, Christmas, Ramadan specials).
                </span>
              </div>
            </label>
          </div>
        </div>

        <h3 className="text-sm font-bold text-stone-900 border-t border-stone-100 pt-5">
          General Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Cake Name */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-stone-800 mb-1">
              Cake Display Name{" "}
              {previewCode ? (
                <span className="text-stone-400 font-normal">
                  (Optional — defaults to &ldquo;Wasana Cake {previewCode}&rdquo;)
                </span>
              ) : (
                <span className="text-amber-700">*</span>
              )}
            </label>
            <input
              type="text"
              required={!previewCode}
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={
                previewCode
                  ? `e.g. Butter Cream Floral Cake (or leave empty for Wasana Cake ${previewCode})`
                  : "e.g. Chocolate Bloom Cake"
              }
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Web Address Slug */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-stone-800">
                Web Link Address (Slug) <span className="text-amber-700">*</span>
              </label>
              <button
                type="button"
                onClick={() => setAutoSlug(!autoSlug)}
                className="text-[11px] text-amber-700 hover:text-amber-800 font-medium"
              >
                {autoSlug ? "Edit manually" : "Auto-generate from name or code"}
              </button>
            </div>
            <div className="flex items-center rounded-lg border border-stone-300 bg-stone-50 overflow-hidden focus-within:ring-2 focus-within:ring-amber-500">
              <span className="px-3 py-2 text-xs text-stone-500 bg-stone-100 border-r border-stone-300 select-none">
                /cakes/
              </span>
              <input
                type="text"
                required
                value={slug}
                readOnly={autoSlug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder={previewCode ? previewCode.toLowerCase() : "chocolate-bloom-cake"}
                className={`w-full px-3 py-2 text-sm focus:outline-hidden ${
                  autoSlug ? "bg-stone-50 text-stone-600 cursor-not-allowed" : "bg-white text-stone-900"
                }`}
              />
            </div>
            <p className="text-[11px] text-stone-400 mt-1">
              Used in the website address: /cakes/{slug || "cake-code"}
            </p>
          </div>

          {/* Base Price in LKR */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              Starting Base Price (LKR) <span className="text-amber-700">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-stone-500 pointer-events-none">
                LKR
              </span>
              <input
                type="number"
                step="1"
                min="0"
                required
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="4500"
                className="w-full pl-12 pr-3 py-2.5 text-sm bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono font-semibold"
              />
            </div>
            <p className="text-[11px] text-stone-400 mt-1">
              The base price of the cake before any option adjustments.
            </p>
          </div>

          {/* Visibility / Status */}
          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded-sm border-stone-300 focus:ring-amber-500"
              />
              <div>
                <span className="text-xs font-bold text-stone-900 block">
                  Publish on website
                </span>
                <span className="text-[11px] text-stone-500 block">
                  If checked, this cake will be visible in the public catalogue.
                </span>
              </div>
            </label>

            {isEditing && (
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded-sm border-stone-300 focus:ring-amber-500"
                />
                <div>
                  <span className="text-xs font-bold text-stone-900 block">
                    Active Product (Keep checked)
                  </span>
                  <span className="text-[11px] text-stone-500 block">
                    Uncheck to archive/soft-delete without breaking past records.
                  </span>
                </div>
              </label>
            )}
          </div>

          {/* Short Description */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-stone-800 mb-1">
              Short Summary (shown on catalogue card)
            </label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="e.g. Rich dark chocolate layers with handcrafted sugar roses..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Full Description */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-stone-800 mb-1">
              Full Cake Description <span className="text-amber-700">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of flavors, ingredients, allergens, celebration occasions..."
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* Image Uploader Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
        <ImageUploader images={images} onChange={setImages} />
      </div>

      {/* Customization Options Builder */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
        <CustomizationGroupEditor
          groups={customizationGroups}
          onChange={setCustomizationGroups}
        />
      </div>

      {/* Bottom Save Bar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
        <Link
          href="/admin/products"
          className="px-5 py-2.5 text-xs font-semibold rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-lg bg-amber-600 text-white hover:bg-amber-700 active:scale-98 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Save Cake"}</span>
        </button>
      </div>
    </form>
  );
}
