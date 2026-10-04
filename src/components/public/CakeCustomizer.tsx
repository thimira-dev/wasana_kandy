"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { formatLKR, calculateCustomizedPrice } from "@/lib/domain/pricing";
import { validateCustomerSelections, CustomerCustomizationSelections } from "@/lib/domain/validation";
import { getProductDisplayName } from "@/lib/domain/catalogue";
import { CakeImage } from "@/components/public/CakeImage";
import { useCart } from "@/context/CartContext";
import { CheckCircle2, AlertCircle, ArrowRight, Sparkles, Sliders } from "lucide-react";

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
  const { addToCart } = useCart();
  const displayName = getProductDisplayName(product);

  const primaryImg = product.images.find((img) => img.isPrimary) || product.images[0];
  const [selectedImage, setSelectedImage] = useState<string>(
    primaryImg?.url || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80"
  );

  const [selections, setSelections] = useState<CustomerCustomizationSelections>(() => {
    const initial: CustomerCustomizationSelections = {};
    for (const group of product.customizationGroups) {
      if (group.fieldType === "SINGLE_SELECT" && group.options.length > 0) {
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

  const handleSingleSelect = (groupId: string, optionId: string) => {
    setSelections((prev) => ({
      ...prev,
      [groupId]: { ...prev[groupId], optionId },
    }));

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

    const validation = validateCustomerSelections(product.customizationGroups, selections);

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      setOrderPrepared(false);

      const firstErrorKey = Object.keys(validation.errors)[0];
      const errorElement = document.getElementById(`group-${firstErrorKey}`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

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

    const numBasePrice = typeof product.basePrice === "number" ? product.basePrice : parseFloat(product.basePrice) || 0;
    const finalPrice = priceCalculation.totalCents / 100;

    addToCart({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      catalogueCode: product.catalogueCode,
      mainCategory: product.mainCategory,
      basePrice: numBasePrice,
      price: finalPrice,
      imageUrl: primaryImg?.url || undefined,
      customizationSummary,
      selections,
    });

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
      {/* LEFT COLUMN: Gallery */}
      <div className="lg:col-span-6 space-y-4">
        <div className="relative aspect-4/3 sm:aspect-square w-full rounded-2xl overflow-hidden glass-card">
          <CakeImage
            src={selectedImage}
            alt={displayName}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>

        {product.images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {product.images.map((img) => (
              <button
                key={img.id}
                type="button"
                suppressHydrationWarning
                onClick={() => setSelectedImage(img.url)}
                className={`relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                  selectedImage === img.url
                    ? "border-[#F59E0B] ring-2 ring-[#F59E0B]/30 scale-105"
                    : "border-[#E9E8E4] opacity-75 hover:opacity-100"
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

      {/* RIGHT COLUMN: Controls */}
      <div className="lg:col-span-6 flex flex-col">
        <div className="border-b border-[#E9E8E4] pb-5">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {product.catalogueCode && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#1B1C1A] text-[#F59E0B] tracking-wider">
                Code: {product.catalogueCode}
              </span>
            )}
            {product.mainCategory && (
              <span className="text-xs font-bold text-[#855300] uppercase tracking-wider">
                {product.mainCategory}
              </span>
            )}
            {product.isSeasonal && (
              <span className="badge-ruby">
                Seasonal Special
              </span>
            )}
          </div>

          <h1 className="text-headline-xl text-[#1B1C1A]">
            {displayName}
          </h1>

          {product.shortDescription && (
            <p className="text-[#534434] text-sm mt-2 leading-relaxed">
              {product.shortDescription}
            </p>
          )}

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-xs text-[#867461] font-medium">Base Price:</span>
            <span className="text-price-lg text-[#1B1C1A]">
              {formatLKR(product.basePrice)}
            </span>
          </div>
        </div>

        {/* About */}
        <div className="py-4 border-b border-[#E9E8E4]">
          <h2 className="text-xs font-bold text-[#855300] uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" /> About this Confection
          </h2>
          <p className="text-sm text-[#1B1C1A] whitespace-pre-line leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Options */}
        <form onSubmit={handleContinue} method="POST" action="javascript:void(0);" className="py-6 space-y-6 flex-1">
          {product.customizationGroups.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-[#1B1C1A] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#F59E0B]" />
                <span>Customise Your Cake</span>
              </h2>

              {product.customizationGroups.map((group) => {
                const error = fieldErrors[group.id];

                return (
                  <fieldset
                    key={group.id}
                    id={`group-${group.id}`}
                    className={`p-4 rounded-2xl transition-colors ${
                      error ? "border border-[#E11D48] bg-[#E11D48]/5" : "glass-floating"
                    }`}
                  >
                    <legend className="px-2 text-sm font-bold text-[#1B1C1A] flex items-center gap-1.5">
                      <span>{group.name}</span>
                      {group.isRequired ? (
                        <span className="text-[#E11D48] text-xs font-bold">(Required)</span>
                      ) : (
                        <span className="text-[#867461] text-xs font-normal">(Optional)</span>
                      )}
                    </legend>

                    {group.helperText && (
                      <p className="text-xs text-[#534434] mb-3 px-1">{group.helperText}</p>
                    )}

                    {/* SINGLE_SELECT */}
                    {group.fieldType === "SINGLE_SELECT" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
                        {group.options.map((option) => {
                          const isSelected = selections[group.id]?.optionId === option.id;
                          const adjNum = Number(option.priceAdjustment);
                          const hasAdjustment = adjNum !== 0;

                          return (
                            <label
                              key={option.id}
                              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer text-sm transition-all ${
                                isSelected
                                  ? "border-[#F59E0B] bg-[#F59E0B]/15 text-[#1B1C1A] font-bold shadow-xs"
                                  : "border-[#E9E8E4] bg-white/70 text-[#1B1C1A] hover:border-[#F59E0B]/50"
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
                                  className="w-4 h-4 text-[#F59E0B] border-[#D8C3AD] focus:ring-[#F59E0B]"
                                />
                                <span>{option.label}</span>
                              </div>

                              {hasAdjustment && (
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/80 text-[#855300]">
                                  {adjNum > 0 ? `+ ${formatLKR(option.priceAdjustment)}` : formatLKR(option.priceAdjustment)}
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* TEXT */}
                    {group.fieldType === "TEXT" && (
                      <div className="mt-2 space-y-1">
                        <input
                          type="text"
                          value={selections[group.id]?.textValue || ""}
                          onChange={(e) => handleTextChange(group.id, e.target.value)}
                          maxLength={group.maxCharacters || undefined}
                          placeholder={`Enter ${group.name.toLowerCase()}...`}
                          suppressHydrationWarning
                          className="w-full px-4 py-2.5 text-sm bg-white/80 rounded-xl border border-[#D8C3AD] focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/30 outline-none transition-all"
                        />
                      </div>
                    )}

                    {/* TEXTAREA */}
                    {group.fieldType === "TEXTAREA" && (
                      <div className="mt-2 space-y-1">
                        <textarea
                          rows={3}
                          value={selections[group.id]?.textValue || ""}
                          onChange={(e) => handleTextChange(group.id, e.target.value)}
                          maxLength={group.maxCharacters || undefined}
                          placeholder={`Enter ${group.name.toLowerCase()}...`}
                          suppressHydrationWarning
                          className="w-full px-4 py-2.5 text-sm bg-white/80 rounded-xl border border-[#D8C3AD] focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/30 outline-none transition-all"
                        />
                      </div>
                    )}

                    {error && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-[#E11D48] font-bold">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}
                  </fieldset>
                );
              })}
            </div>
          )}

          {/* DYNAMIC TOTAL PRICE GLASS STICKY BAR */}
          <div className="mt-6 p-5 glass-floating flex flex-col sm:flex-row items-center justify-between gap-4 border border-[#F59E0B]/30">
            <div>
              <span className="text-xs font-bold text-[#855300] uppercase tracking-wider block">
                Total Price (with selections)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-price-lg text-[#1B1C1A]">
                  {priceCalculation.totalFormatted}
                </span>
                {priceCalculation.adjustmentsCents > 0 && (
                  <span className="text-xs text-[#855300] font-semibold">
                    (includes +{priceCalculation.adjustmentsFormatted} options)
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleContinue}
              suppressHydrationWarning
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-bold btn-primary-gold cursor-pointer"
            >
              <span>Confirm &amp; Order</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {orderPrepared && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-900 text-sm animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  Selections confirmed ({priceCalculation.totalFormatted})!
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Proceeding to pickup branch &amp; contact details...
                </p>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
