"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Cake } from "lucide-react";

interface CakeImageProps {
  src?: string | null;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
  fallbackText?: string;
}

export function CakeImage({
  src,
  alt,
  fill = true,
  width,
  height,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  className = "object-cover",
  priority = false,
  fallbackText = "Cake image unavailable",
}: CakeImageProps) {
  const [hasError, setHasError] = useState(false);

  // If source is missing or image errored out
  if (!src || src.trim().length === 0 || hasError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-stone-100 text-stone-400 p-4 select-none">
        <div className="w-10 h-10 rounded-full bg-stone-200/70 flex items-center justify-center mb-2">
          <Cake className="w-5 h-5 text-stone-400" />
        </div>
        <span className="text-xs font-medium text-stone-500">{fallbackText}</span>
      </div>
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={className}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width || 400}
      height={height || 300}
      priority={priority}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}
