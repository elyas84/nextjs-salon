"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ProjectGallery({ images, title }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="flex aspect-video min-h-48 w-full items-center justify-center bg-zinc-900 text-[10px] uppercase tracking-[0.2em] text-zinc-600">
        No images
      </div>
    );
  }

  const handleNext = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="flex flex-col bg-zinc-950">
      <div className="group relative aspect-video w-full overflow-hidden">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[activeIndex]}
            alt={`${title} — image ${activeIndex + 1} of ${images.length}`}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        </div>

        {images.length > 1 && (
          <>
            <div className="absolute inset-x-3 top-1/2 z-30 flex -translate-y-1/2 justify-between sm:inset-x-5 lg:opacity-0 lg:transition-opacity lg:duration-300 lg:group-hover:opacity-100">
              <button
                onClick={handlePrev}
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-white hover:text-zinc-900 active:scale-95 sm:h-11 sm:w-11"
                aria-label="Previous image"
              >
                <ChevronLeft size={20} strokeWidth={1.75} />
              </button>
              <button
                onClick={handleNext}
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-white hover:text-zinc-900 active:scale-95 sm:h-11 sm:w-11"
                aria-label="Next image"
              >
                <ChevronRight size={20} strokeWidth={1.75} />
              </button>
            </div>

            <div className="absolute inset-x-0 bottom-4 z-30 flex justify-center gap-1 px-4 sm:bottom-5 lg:opacity-0 lg:transition-opacity lg:duration-300 lg:group-hover:opacity-100">
              {images.map((_, index) => (
                <button
                  key={`${title}-dot-${index}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIndex(index);
                  }}
                  type="button"
                  className={`h-1 rounded-full transition-all duration-300 ${
                    index === activeIndex
                      ? "w-6 bg-blue-500"
                      : "w-2 bg-white/35 hover:bg-white/55"
                  }`}
                  aria-label={`Image ${index + 1}`}
                  aria-current={index === activeIndex ? "true" : undefined}
                />
              ))}
            </div>
          </>
        )}

        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/15 via-transparent to-black/40" />
      </div>

      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto border-t border-zinc-800/90 bg-zinc-950 p-2.5 sm:p-3 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-700">
          {images.map((src, index) => (
            <button
              key={`${title}-thumb-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`shrink-0 overflow-hidden rounded-md ring-2 ring-offset-2 ring-offset-zinc-950 transition-all ${
                index === activeIndex
                  ? "ring-blue-500"
                  : "ring-transparent opacity-65 hover:opacity-100"
              }`}
              aria-label={`Show image ${index + 1}`}
              aria-current={index === activeIndex ? "true" : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                className="h-12 w-19 object-cover sm:h-14 sm:w-22"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
