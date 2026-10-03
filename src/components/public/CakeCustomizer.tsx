"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { formatLKR, calculateCustomizedPrice } from "@/lib/domain/pricing";
import { validateCustomerSelections, CustomerCustomizationSelections } from "@/lib/domain/validation";
import { getProductDisplayName } from "@/lib/domain/catalogue";
import { CakeImage } from "@/components/public/CakeImage";
import { CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

export interface CustomizationOptionData {
  id: string;
  label: string;
  priceAdjustment: string | number;
  sortOrder: number;
  isActive: boolean;
}

export interface CustomizationGroupData {
  id: string;
  name: string;
  fieldType: "SINGLE_SELECT" | "MULTI_SELECT" | "TEXT" | "TEXTAREA" | "IMAGE_UPLOAD";
  isRequired: boolean;
  sortOrder: number;
  isActive: boolean;
  helperText?: string | null;
  maxCharacters?: number | null;
  options: CustomizationOptionData[];
}

export interface ProductImageData {
  id: string;
  url: string;
  altText?: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

export interface CakeCustomizerProps {
  product: {
    id: string;
    name: string;
    slug: string;
    catalogueCode?: string | null;
    mainCategory?: string | null;
    collectionCode?: string | null;
    designNumber?: number | null;
    isSeasonal?: boolean;
    description: string;
    shortDescription?: string | null;
    basePrice: string | number;
    images: ProductImageData[];
    customizationGroups: CustomizationGroupData[];
  };
}

export function CakeCustomizer({ product }: CakeCustomizerProps) {
  const displayName = getProductDisplayName(product);

  // Gallery active image
  const primaryImg = product.images.find((img) => img.isPrimary) || product.images[0];
  const [selectedImage, setSelectedImage] = useState<string>(
    primaryImg?.url || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80"
  );

  // State for user's customization selections
  const [selections, setSelections] = useState<CustomerCustomizationSelections>(() => {
    const initial: CustomerCustomizationSelections = {};
    // Pre-select if single select has a default or 0 price option
    for (const group of product.customizationGroups) {
      if (group.fieldType === "SINGLE_SELECT" && group.options.length > 0) {
        // Find first active option (often 0 price adjustment)
        const defaultOpt = group.options.find((o) => o.isActive);
        if (defaultOpt) {
          initial[group.id] = { optionId: defaultOpt.id };
        }
      } else {
        initial[group.id] = { textValue: "" };
      }
    }
    return initial;
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [orderPrepared, setOrderPrepared] = useState(false);

  // Calculate live price based on selected options
  const priceCalculation = useMemo(() => {
    const selectedOptionObjects: { priceAdjustment: string | number }[] = [];

    for (const group of product.customizationGroups) {
      if (group.fieldType === "SINGLE_SELECT") {
        const selectedId = selections[group.id]?.optionId;
        if (selectedId) {
          const opt = group.options.find((o) => o.id === selectedId);
          if (opt) {
            selectedOptionObjects.push({ priceAdjustment: opt.priceAdjustment });
          }
        }
      }
    }

    return calculateCustomizedPrice(product.basePrice, selectedOptionObjects);
  }, [product.basePrice, product.customizationGroups, selections]);

  // Handlers for selection changes
  const handleSingleSelect = (groupId: string, optionId: string) => {
    setSelections((prev) => ({
      ...prev,
      [groupId]: { ...prev[groupId], optionId },
    }));

    // Clear error for this field
    if (fieldErrors[groupId]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[groupId];
        return next;
      });
    }
  };

  const handleTextChange = (groupId: string, value: string) => {
    setSelections((prev) => ({
      ...prev,
      [groupId]: { ...prev[groupId], textValue: value },
    }));

    if (fieldErrors[groupId]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[groupId];
        return next;
      });
    }
  };

  const router = useRouter();

  // Restore previous selections from sessionStorage if returning via "Edit Cake"
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("wasana_pending_order");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.productId === product.id && parsed.selections) {
            setSelections(parsed.selections);
          }
        }
      } catch (err) {
        console.error("Error restoring pending order:", err);
      }
    }
  }, [product.id]);

  const handleContinue = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      if ("stopPropagation" in e) e.stopPropagation();
    }

    // Validate customer selections
    const validation = validateCustomerSelections(product.customizationGroups, selections);

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      setOrderPrepared(false);

      // Scroll to first error
      const firstErrorKey = Object.keys(validation.errors)[0];
      const errorElement = document.getElementById(`group-${firstErrorKey}`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    // Build human-friendly customization summary for the checkout sidebar
    const customizationSummary: Array<{
      groupName: string;
      fieldType: string;
      labelOrValue: string;
      priceAdjustment: string | number;
    }> = [];

    for (const group of product.customizationGroups) {
      const sel = selections[group.id];
      if (group.fieldType === "SINGLE_SELECT" && sel?.optionId) {
        const opt = group.options.find((o) => o.id === sel.optionId);
        if (opt) {
          customizationSummary.push({
            groupName: group.name,
            fieldType: group.fieldType,
            labelOrValue: opt.label,
            priceAdjustment: opt.priceAdjustment,
          });
        }
      } else if ((group.fieldType === "TEXT" || group.fieldType === "TEXTAREA") && sel?.textValue) {
        customizationSummary.push({
          groupName: group.name,
          fieldType: group.fieldType,
          labelOrValue: sel.textValue,
          priceAdjustment: 0,
        });
      }
    }

    // Save customization payload into sessionStorage for Part 2 checkout
    const orderPayload = {
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      productImage: primaryImg?.url || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800",
      basePrice: product.basePrice,
      totalPriceFormatted: priceCalculation.totalFormatted,
      totalCents: priceCalculation.totalCents,
      selections,
      customizationSummary,
      timestamp: Date.now(),
    };

    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("wasana_pending_order", JSON.stringify(orderPayload));
      } catch (err) {
        console.error("Session storage error:", err);
      }
    }

    setOrderPrepared(true);
    router.push("/checkout/details");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
      {/* LEFT COLUMN: Image Gallery */}
      <div className="lg:col-span-6 space-y-4">
        <div className="relative aspect-4/3 sm:aspect-square w-full rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shadow-sm">
          <CakeImage
            src={selectedImage}
            alt={displayName}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>

        {/* Thumbnail selector */}
        {product.images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {product.images.map((img) => (
              <button
                key={img.id}
                type="button"
                suppressHydrationWarning
                onClick={() => setSelectedImage(img.url)}
                className={`relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                  selectedImage === img.url
                    ? "border-amber-600 ring-2 ring-amber-200"
                    : "border-stone-200 hover:border-amber-400 opacity-80 hover:opacity-100"
                }`}
              >
                <CakeImage
                  src={img.url}
                  alt={img.altText || displayName}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Product Information & Customization Controls */}
      <div className="lg:col-span-6 flex flex-col">
        <div className="border-b border-stone-200 pb-5">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {product.catalogueCode && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-stone-900 text-amber-300 tracking-wider">
                Code: {product.catalogueCode}
              </span>
            )}
            {product.mainCategory ? (
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                {product.mainCategory}
              </span>
            ) : (
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                Wasana Signature Cake
              </span>
            )}
            {product.isSeasonal && (
              <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-amber-600 text-white">
                Seasonal Special
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
            {displayName}
          </h1>

          {product.shortDescription && (
            <p className="text-stone-600 text-sm mt-2 leading-relaxed">
              {product.shortDescription}
            </p>
          )}

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-xs text-stone-500 font-medium">Base Price:</span>
            <span className="text-xl font-bold text-stone-800">
              {formatLKR(product.basePrice)}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="py-4 border-b border-stone-200">
          <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
            About this cake
          </h2>
          <p className="text-sm text-stone-700 whitespace-pre-line leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Customization Options Form */}
        <form onSubmit={handleContinue} method="POST" action="javascript:void(0);" className="py-6 space-y-6 flex-1">
          {product.customizationGroups.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <span>Customize Your Cake</span>
                <span className="text-xs font-normal text-stone-500">
                  (Choose your preferred options below)
                </span>
              </h2>

              {product.customizationGroups.map((group) => {
                const error = fieldErrors[group.id];

                return (
                  <fieldset
                    key={group.id}
                    id={`group-${group.id}`}
                    className={`p-4 rounded-xl border transition-colors ${
                      error ? "border-rose-400 bg-rose-50/40" : "border-stone-200 bg-stone-50/50"
                    }`}
                  >
                    <legend className="px-2 text-sm font-bold text-stone-800 flex items-center gap-1.5">
                      <span>{group.name}</span>
                      {group.isRequired ? (
                        <span className="text-rose-600 text-xs font-semibold">(Required)</span>
                      ) : (
                        <span className="text-stone-400 text-xs font-normal">(Optional)</span>
                      )}
                    </legend>

                    {group.helperText && (
                      <p className="text-xs text-stone-500 mb-3 px-1">{group.helperText}</p>
                    )}

                    {/* SINGLE_SELECT Field: Radio buttons */}
                    {group.fieldType === "SINGLE_SELECT" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
                        {group.options.map((option) => {
                          const isSelected = selections[group.id]?.optionId === option.id;
                          const adjNum = Number(option.priceAdjustment);
                          const hasAdjustment = adjNum !== 0;

                          return (
                            <label
                              key={option.id}
                              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer text-sm transition-all ${
                                isSelected
                                  ? "border-amber-600 bg-amber-50/80 text-amber-950 font-medium ring-1 ring-amber-600"
                                  : "border-stone-200 bg-white text-stone-700 hover:border-amber-300"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="radio"
                                  name={`group_${group.id}`}
                                  value={option.id}
                                  checked={isSelected}
                                  onChange={() => handleSingleSelect(group.id, option.id)}
                                  suppressHydrationWarning
                                  className="w-4 h-4 text-amber-600 border-stone-300 focus:ring-amber-500"
                                />
                                <span>{option.label}</span>
                              </div>

                              {hasAdjustment && (
                                <span
                                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                    isSelected
                                      ? "bg-amber-200/80 text-amber-800"
                                      : "bg-stone-100 text-stone-600"
                                  }`}
                                >
                                  {adjNum > 0 ? `+ ${formatLKR(option.priceAdjustment)}` : formatLKR(option.priceAdjustment)}
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* TEXT Field: Single-line input */}
                    {group.fieldType === "TEXT" && (
                      <div className="mt-2 space-y-1">
                        <input
                          type="text"
                          value={selections[group.id]?.textValue || ""}
                          onChange={(e) => handleTextChange(group.id, e.target.value)}
                          maxLength={group.maxCharacters || undefined}
                          placeholder={`Enter ${group.name.toLowerCase()}...`}
                          suppressHydrationWarning
                          className={`w-full px-3.5 py-2.5 text-sm bg-white rounded-lg border focus:ring-2 focus:outline-hidden transition-colors ${
                            error
                              ? "border-rose-400 focus:ring-rose-200"
                              : "border-stone-300 focus:border-amber-600 focus:ring-amber-100"
                          }`}
                        />
                        {group.maxCharacters && (
                          <div className="flex justify-end text-xs text-stone-500 px-1">
                            <span>
                              {(selections[group.id]?.textValue || "").length} / {group.maxCharacters} characters
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TEXTAREA Field: Multi-line input */}
                    {group.fieldType === "TEXTAREA" && (
                      <div className="mt-2 space-y-1">
                        <textarea
                          rows={3}
                          value={selections[group.id]?.textValue || ""}
                          onChange={(e) => handleTextChange(group.id, e.target.value)}
                          maxLength={group.maxCharacters || undefined}
                          placeholder={`Enter ${group.name.toLowerCase()}...`}
                          suppressHydrationWarning
                          className={`w-full px-3.5 py-2.5 text-sm bg-white rounded-lg border focus:ring-2 focus:outline-hidden transition-colors ${
                            error
                              ? "border-rose-400 focus:ring-rose-200"
                              : "border-stone-300 focus:border-amber-600 focus:ring-amber-100"
                          }`}
                        />
                        {group.maxCharacters && (
                          <div className="flex justify-end text-xs text-stone-500 px-1">
                            <span>
                              {(selections[group.id]?.textValue || "").length} / {group.maxCharacters} characters
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Field Level Error Message */}
                    {error && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-600 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}
                  </fieldset>
                );
              })}
            </div>
          )}

          {/* DYNAMIC TOTAL PRICE CARD */}
          <div className="mt-6 p-5 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-stone-600 uppercase tracking-wider block">
                Total Price (with selected options)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-amber-900">
                  {priceCalculation.totalFormatted}
                </span>
                {priceCalculation.adjustmentsCents > 0 && (
                  <span className="text-xs text-amber-700 font-medium">
                    (includes +{priceCalculation.adjustmentsFormatted} customizations)
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleContinue}
              suppressHydrationWarning
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-bold rounded-xl bg-amber-600 text-white hover:bg-amber-700 active:scale-98 transition-all shadow-md hover:shadow-lg focus:ring-4 focus:ring-amber-200 focus:outline-hidden cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Feedback after clicking continue (Phase 1 completion feedback) */}
          {orderPrepared && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-900">
                  Cake selections saved for checkout!
                </p>
                <p className="text-xs text-emerald-700 mt-1">
                  Customization options and pricing ({priceCalculation.totalFormatted}) have been confirmed.
                  The subsequent customer details and payment step will be connected in Part 2.
                </p>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
