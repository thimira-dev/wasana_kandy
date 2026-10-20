"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { formatLKR, calculateCustomizedPrice } from "@/lib/domain/pricing";
import { validateCustomerSelections, CustomerCustomizationSelections } from "@/lib/domain/validation";
import { getProductDisplayName } from "@/lib/domain/catalogue";
import { CakeImage } from "@/components/public/CakeImage";
import { CheckCircle2, AlertCircle, ArrowRight, Sparkles, Sliders, Maximize2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

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

  const primaryImg = product.images.find((img) => img.isPrimary) || product.images[0];
  const [selectedImage, setSelectedImage] = useState<string>(
    primaryImg?.url || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80"
  );
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentImageIndex = Math.max(0, product.images.findIndex((img) => img.url === selectedImage));

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (product.images.length <= 1) return;
    const prevIdx = currentImageIndex <= 0 ? product.images.length - 1 : currentImageIndex - 1;
    setSelectedImage(product.images[prevIdx].url);
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (product.images.length <= 1) return;
    const nextIdx = currentImageIndex >= product.images.length - 1 ? 0 : currentImageIndex + 1;
    setSelectedImage(product.images[nextIdx].url);
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFullscreen(false);
      } else if (e.key === "ArrowLeft") {
        if (product.images.length > 1) {
          const idx = product.images.findIndex((img) => img.url === selectedImage);
          const prevIdx = idx <= 0 ? product.images.length - 1 : idx - 1;
          setSelectedImage(product.images[prevIdx].url);
        }
      } else if (e.key === "ArrowRight") {
        if (product.images.length > 1) {
          const idx = product.images.findIndex((img) => img.url === selectedImage);
          const nextIdx = idx >= product.images.length - 1 ? 0 : idx + 1;
          setSelectedImage(product.images[nextIdx].url);
        }
      }
    };

    if (isFullscreen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen, product.images, selectedImage]);

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
      if (firstErrorKey) {
        setTimeout(() => {
          const errorElement = document.getElementById(`group-${firstErrorKey}`);
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
            const inputEl = errorElement.querySelector("input, textarea, button") as HTMLElement | null;
            if (inputEl && "focus" in inputEl) {
              inputEl.focus({ preventScroll: true });
            }
          }
        }, 50);
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12">
      {/* LEFT COLUMN: Gallery */}
      <div className="lg:col-span-6 space-y-3 sm:space-y-4">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsFullscreen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsFullscreen(true);
            }
          }}
          className="relative aspect-4/3 sm:aspect-square w-full rounded-xl sm:rounded-2xl overflow-hidden glass-card cursor-zoom-in group select-none"
          aria-label="Tap to view cake full screen"
        >
          <CakeImage
            src={selectedImage}
            alt={displayName}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Full Screen Badge Overlay */}
          <div className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 px-2 sm:px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-semibold flex items-center gap-1.5 shadow-sm opacity-90 group-hover:opacity-100 transition-opacity">
            <Maximize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#F59E0B]" />
            <span>Tap for full view</span>
          </div>
        </div>

        {product.images.length > 1 && (
          <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1.5 sm:pb-2 scrollbar-hide">
            {product.images.map((img) => (
              <button
                key={img.id}
                type="button"
                suppressHydrationWarning
                onClick={() => setSelectedImage(img.url)}
                className={`relative w-14 h-14 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
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
        <div className="border-b border-[#E9E8E4] pb-4 sm:pb-5">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
            {product.catalogueCode && (
              <span className="inline-flex items-center px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-mono font-bold bg-[#1B1C1A] text-[#F59E0B] tracking-wider">
                Code: {product.catalogueCode}
              </span>
            )}
            {product.mainCategory && (
              <span className="text-[11px] sm:text-xs font-bold text-[#855300] uppercase tracking-wider">
                {product.mainCategory}
              </span>
            )}
            {product.isSeasonal && (
              <span className="badge-ruby text-[11px] sm:text-xs px-2.5 py-0.5">
                Seasonal Special
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-[#1B1C1A] leading-tight">
            {displayName}
          </h1>

          {product.shortDescription && (
            <p className="text-[#534434] text-xs sm:text-sm mt-1.5 sm:mt-2 leading-relaxed">
              {product.shortDescription}
            </p>
          )}

          <div className="mt-3 sm:mt-4 flex items-baseline gap-2">
            <span className="text-xs text-[#867461] font-medium">Base Price:</span>
            <span className="text-lg sm:text-price-lg font-bold font-mono text-[#1B1C1A]">
              {formatLKR(product.basePrice)}
            </span>
          </div>
        </div>

        {/* About */}
        <div className="py-3.5 sm:py-4 border-b border-[#E9E8E4]">
          <h2 className="text-[11px] sm:text-xs font-bold text-[#855300] uppercase tracking-wider mb-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" /> About this Confection
          </h2>
          <p className="text-xs sm:text-sm text-[#1B1C1A] whitespace-pre-line leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Options */}
        <form onSubmit={handleContinue} method="POST" action="javascript:void(0);" className="py-4 sm:py-6 space-y-4 sm:space-y-6 flex-1">
          {product.customizationGroups.length > 0 && (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-sm sm:text-base font-bold text-[#1B1C1A] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#F59E0B]" />
                <span>Customise Your Cake</span>
              </h2>

              {product.customizationGroups.map((group) => {
                const error = fieldErrors[group.id];

                return (
                  <fieldset
                    key={group.id}
                    id={`group-${group.id}`}
                    className={`p-3.5 sm:p-5 rounded-xl sm:rounded-2xl scroll-mt-24 transition-all ${
                      error ? "border-2 border-[#E11D48] bg-[#E11D48]/10 ring-4 ring-[#E11D48]/25 shadow-md shadow-rose-500/10" : "glass-card"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-base font-bold text-[#1B1C1A]">{group.name}</span>
                        {group.isRequired ? (
                          <span className="text-[#E11D48] text-[10px] sm:text-xs font-bold bg-[#E11D48]/10 px-2 py-0.5 rounded-full">(Required)</span>
                        ) : (
                          <span className="text-[#867461] text-[10px] sm:text-xs font-normal bg-stone-100 px-2 py-0.5 rounded-full">(Optional)</span>
                        )}
                      </div>
                    </div>

                    {group.helperText && (
                      <p className="text-[11px] sm:text-xs text-[#534434] mb-2.5 sm:mb-3.5 leading-relaxed">{group.helperText}</p>
                    )}

                    {/* SINGLE_SELECT */}
                    {group.fieldType === "SINGLE_SELECT" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-1.5 sm:mt-2">
                        {group.options.map((option) => {
                          const isSelected = selections[group.id]?.optionId === option.id;
                          const adjNum = Number(option.priceAdjustment);
                          const hasAdjustment = adjNum !== 0;

                          return (
                            <label
                              key={option.id}
                              className={`flex items-center justify-between gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-lg sm:rounded-xl border cursor-pointer text-xs sm:text-sm transition-all ${
                                isSelected
                                  ? "border-[#F59E0B] bg-[#F59E0B]/15 text-[#1B1C1A] font-bold shadow-xs ring-1 ring-[#F59E0B]/50"
                                  : "border-[#E9E8E4] bg-white/80 text-[#1B1C1A] hover:border-[#F59E0B]/50 hover:bg-white"
                              }`}
                            >
                              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                                <input
                                  type="radio"
                                  name={`group_${group.id}`}
                                  value={option.id}
                                  checked={isSelected}
                                  onChange={() => handleSingleSelect(group.id, option.id)}
                                  suppressHydrationWarning
                                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-[#F59E0B] border-[#D8C3AD] focus:ring-[#F59E0B]"
                                />
                                <span className="font-semibold text-[#1B1C1A] leading-snug break-words">{option.label}</span>
                              </div>

                              {hasAdjustment && (
                                <span className="shrink-0 text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-[#F59E0B]/10 text-[#855300] border border-[#F59E0B]/20 whitespace-nowrap ml-auto">
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
                      <div className="mt-1.5 sm:mt-2 space-y-1">
                        <input
                          type="text"
                          value={selections[group.id]?.textValue || ""}
                          onChange={(e) => handleTextChange(group.id, e.target.value)}
                          maxLength={group.maxCharacters || undefined}
                          placeholder={`Enter ${group.name.toLowerCase()}...`}
                          suppressHydrationWarning
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-white/80 rounded-lg sm:rounded-xl border border-[#D8C3AD] focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/30 outline-none transition-all"
                        />
                      </div>
                    )}

                    {/* TEXTAREA */}
                    {group.fieldType === "TEXTAREA" && (
                      <div className="mt-1.5 sm:mt-2 space-y-1">
                        <textarea
                          rows={2}
                          value={selections[group.id]?.textValue || ""}
                          onChange={(e) => handleTextChange(group.id, e.target.value)}
                          maxLength={group.maxCharacters || undefined}
                          placeholder={`Enter ${group.name.toLowerCase()}...`}
                          suppressHydrationWarning
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-white/80 rounded-lg sm:rounded-xl border border-[#D8C3AD] focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/30 outline-none transition-all"
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
          <div className="mt-4 sm:mt-6 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl glass-floating flex flex-row items-center justify-between gap-3 sm:gap-4 border border-[#F59E0B]/30 sticky bottom-3 sm:static z-20 bg-white/95 sm:bg-white/80 backdrop-blur-md shadow-lg sm:shadow-none">
            <div className="min-w-0">
              <span className="text-[10px] sm:text-xs font-bold text-[#855300] uppercase tracking-wider block leading-tight">
                Total Price
              </span>
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <span className="text-base sm:text-price-lg font-bold font-mono text-[#1B1C1A]">
                  {priceCalculation.totalFormatted}
                </span>
                {priceCalculation.adjustmentsCents > 0 && (
                  <span className="text-[10px] sm:text-xs text-[#855300] font-semibold hidden sm:inline">
                    (includes +{priceCalculation.adjustmentsFormatted} options)
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleContinue}
              suppressHydrationWarning
              className="shrink-0 inline-flex items-center justify-center gap-1.5 sm:gap-2 px-5 sm:px-8 py-2.5 sm:py-3.5 text-xs sm:text-base font-bold btn-primary-gold cursor-pointer rounded-xl sm:rounded-full"
            >
              <span>Confirm &amp; Order</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {orderPrepared && (
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 sm:gap-3 text-emerald-900 text-xs sm:text-sm animate-fade-in">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  Selections confirmed ({priceCalculation.totalFormatted})!
                </p>
                <p className="text-[11px] sm:text-xs text-emerald-700 mt-0.5">
                  Proceeding to pickup branch &amp; contact details...
                </p>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsFullscreen(false)}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-6 select-none"
            role="dialog"
            aria-modal="true"
            aria-label={`${displayName} full screen view`}
          >
            {/* Top Bar: Title & Close Button */}
            <div
              className="w-full max-w-6xl flex items-center justify-between text-white py-2 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="min-w-0 pr-4">
                <p className="font-serif text-sm sm:text-lg font-bold truncate text-white">
                  {displayName}
                </p>
                {product.images.length > 1 && (
                  <p className="text-[11px] sm:text-xs text-stone-400">
                    {currentImageIndex + 1} of {product.images.length}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer"
                aria-label="Close full screen view"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Center Image Container */}
            <div
              className="relative w-full max-w-5xl flex-1 flex items-center justify-center my-auto overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full h-[65vh] sm:h-[78vh] flex items-center justify-center">
                <CakeImage
                  src={selectedImage}
                  alt={displayName}
                  fill
                  priority
                  sizes="100vw"
                  className="object-contain"
                />
              </div>

              {/* Prev Button */}
              {product.images.length > 1 && (
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/80 active:scale-95 text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}

              {/* Next Button */}
              {product.images.length > 1 && (
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/80 active:scale-95 text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer z-10"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}
            </div>

            {/* Bottom thumbnail strip in fullscreen */}
            {product.images.length > 1 && (
              <div
                className="w-full max-w-xl flex items-center justify-center gap-2 overflow-x-auto py-2 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                {product.images.map((img, idx) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setSelectedImage(img.url)}
                    className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      selectedImage === img.url
                        ? "border-[#F59E0B] ring-2 ring-[#F59E0B]/50 scale-105"
                        : "border-white/30 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <CakeImage
                      src={img.url}
                      alt={img.altText || `${displayName} thumbnail ${idx + 1}`}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
