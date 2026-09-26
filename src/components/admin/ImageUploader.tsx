"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { UploadCloud, X, Star, AlertCircle, LinkIcon } from "lucide-react";
import { ProductImageInput } from "@/lib/domain/validation";

interface ImageUploaderProps {
  images: ProductImageInput[];
  onChange: (images: ProductImageInput[]) => void;
  error?: string;
}

export function ImageUploader({ images, onChange, error }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      const newImages: ProductImageInput[] = [...images];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to upload image");
        }

        const isFirst = newImages.length === 0;
        newImages.push({
          url: data.url,
          altText: file.name.replace(/\.[^/.]+$/, ""),
          isPrimary: isFirst,
          sortOrder: newImages.length,
        });
      }

      onChange(newImages);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Error uploading image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    const isFirst = images.length === 0;
    const newImages: ProductImageInput[] = [
      ...images,
      {
        url: urlInput.trim(),
        altText: "Cake photo",
        isPrimary: isFirst,
        sortOrder: images.length,
      },
    ];

    onChange(newImages);
    setUrlInput("");
    setShowUrlInput(false);
  };

  const handleSetPrimary = (index: number) => {
    const updated = images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    const wasPrimary = images[index]?.isPrimary;
    const updated = images.filter((_, i) => i !== index);

    // If removed was primary, make the first image primary
    if (wasPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    }

    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-bold text-stone-900">
          Cake Images <span className="text-amber-700">*</span>
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-xs text-amber-700 hover:text-amber-800 font-medium flex items-center gap-1"
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>{showUrlInput ? "Hide image URL option" : "Add by image URL"}</span>
        </button>
      </div>

      {showUrlInput && (
        <div className="flex gap-2 p-3 bg-stone-50 rounded-lg border border-stone-200">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste image web link (https://...)..."
            className="flex-1 px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-md focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="px-3 py-1.5 text-xs font-semibold bg-stone-800 text-white rounded-md hover:bg-stone-700 cursor-pointer"
          >
            Add Link
          </button>
        </div>
      )}

      {/* Upload Drop Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          isUploading
            ? "border-amber-400 bg-amber-50/50 cursor-wait"
            : "border-stone-300 hover:border-amber-600 bg-stone-50/60 hover:bg-amber-50/20"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
        />
        <UploadCloud className="w-8 h-8 mx-auto text-amber-600 mb-2" />
        <p className="text-sm font-semibold text-stone-800">
          {isUploading ? "Uploading cake photo..." : "Click to select or drag & drop cake photos"}
        </p>
        <p className="text-xs text-stone-500 mt-1">
          Supports JPEG, PNG, WEBP, or AVIF (up to 5MB each). First image is used as main photo.
        </p>
      </div>

      {/* Errors */}
      {(uploadError || error) && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError || error}</span>
        </div>
      )}

      {/* Previews Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
          {images.map((img, idx) => (
            <div
              key={idx}
              className={`group relative aspect-square rounded-lg overflow-hidden border-2 bg-stone-100 ${
                img.isPrimary ? "border-amber-600 ring-2 ring-amber-200" : "border-stone-200"
              }`}
            >
              <Image
                src={img.url}
                alt={img.altText || `Cake photo ${idx + 1}`}
                fill
                sizes="120px"
                className="object-cover"
              />

              {/* Primary badge */}
              {img.isPrimary && (
                <div className="absolute top-1 left-1 bg-amber-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm shadow-xs flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-current" />
                  <span>Main</span>
                </div>
              )}

              {/* Actions Overlay */}
              <div className="absolute inset-0 bg-stone-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(idx);
                    }}
                    className="p-1 rounded-md bg-stone-800/80 hover:bg-rose-600 text-white transition-colors"
                    title="Remove photo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {!img.isPrimary && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetPrimary(idx);
                    }}
                    className="w-full py-1 text-[11px] font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-sm text-center"
                  >
                    Set as Main
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
