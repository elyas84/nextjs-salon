"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";

export default function ProductImageGallery({ images = [], alt = "Product image" }) {
  const [selectedImage, setSelectedImage] = useState(images[0] || "");
  const displayImage = images.includes(selectedImage)
    ? selectedImage
    : images[0] || "";

  if (!images.length) {
    return (
      <div className="flex aspect-square max-h-[min(24rem,65vh)] items-center justify-center gap-2 text-xs text-zinc-500">
        <ImageOff className="size-4" />
        No product image
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 sm:gap-10 lg:flex-row lg:items-start lg:gap-14">
      {images.length > 1 ? (
        <div
          className={[
            "flex shrink-0 gap-5 overflow-x-auto sm:gap-6 lg:w-[7.5rem] lg:flex-col lg:gap-5 lg:overflow-y-auto lg:overflow-x-hidden",
            "lg:max-h-[min(28rem,70vh)]",
          ].join(" ")}
          role="tablist"
          aria-label="Product images"
        >
          {images.map((src, index) => {
            const active = displayImage === src;
            return (
              <button
                key={`${src}-${index}`}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedImage(src)}
                className={[
                  "relative aspect-square w-[5.25rem] shrink-0 overflow-hidden rounded-xl border-2 bg-zinc-950/60 transition sm:w-28 lg:w-full",
                  active
                    ? "border-orange-500 shadow-[0_0_0_1px_rgba(249,115,22,0.25)]"
                    : "border-white/20 hover:border-white/40",
                ].join(" ")}
                aria-label={`Image ${index + 1}`}
              >
                <Image
                  src={src}
                  alt={`${alt} thumbnail ${index + 1}`}
                  fill
                  sizes="112px"
                  className="object-contain object-center"
                />
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="relative min-w-0 flex-1">
        <div className="relative mx-auto aspect-square max-h-[min(26rem,68vh)] w-full max-w-xl p-4 sm:p-6">
          <Image
            src={displayImage}
            alt={alt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, min(512px, 50vw)"
            className="object-contain object-center"
          />
        </div>
      </div>
    </div>
  );
}
