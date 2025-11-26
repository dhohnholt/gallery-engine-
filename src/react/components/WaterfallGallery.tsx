import React, { useState, useEffect, useRef, useCallback } from "react";
import type { GalleryImage } from "../../lib/types";
import { Lightbox } from "./Lightbox";
import { preloadImages } from "../utils/preloadImages";

export interface WaterfallGalleryProps {
  images: GalleryImage[];
  heading?: string;
  subheading?: string;
  batchSize?: number; // recommended 40–60
}

export const WaterfallGallery: React.FC<WaterfallGalleryProps> = ({
  images,
  heading,
  subheading,
  batchSize = 50,
}) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // ---- Infinite scroll slices ----
  const [visibleImages, setVisibleImages] = useState<GalleryImage[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loaderRef = useRef<HTMLDivElement | null>(null);

  // --------------------------------------------------
  // 1. Initialize first batch
  // --------------------------------------------------
  useEffect(() => {
    const first = images.slice(0, batchSize);
    setVisibleImages(first);
    setPage(1);
    setHasMore(images.length > batchSize);

    // Preload first handful of medium images
    preloadImages(
      first.slice(0, 8).map((img) => img.medium_url || img.public_url)
    );
  }, [images, batchSize]);

  // --------------------------------------------------
  // 2. Load next batch
  // --------------------------------------------------
  const loadMore = useCallback(() => {
    if (!hasMore) return;

    const start = page * batchSize;
    const next = images.slice(start, start + batchSize);

    setVisibleImages((prev) => [...prev, ...next]);
    setPage((p) => p + 1);
    setHasMore(start + batchSize < images.length);

    // Preload medium versions for smoother lightbox swiping
    preloadImages(
      next.slice(0, 12).map((img) => img.medium_url || img.public_url)
    );
  }, [page, batchSize, images, hasMore]);

  // --------------------------------------------------
  // 3. IntersectionObserver → infinite scroll
  // --------------------------------------------------
  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "600px" } // earlier trigger = smoother UX
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  // --------------------------------------------------
  // 4. Preload adjacent medium images when lightbox opens
  // --------------------------------------------------
  useEffect(() => {
    if (lightboxIndex === null) return;

    const ahead = visibleImages
      .slice(lightboxIndex, lightboxIndex + 6)
      .map((img) => img.medium_url || img.public_url);

    preloadImages(ahead);
  }, [lightboxIndex, visibleImages]);

  // --------------------------------------------------
  // Empty gallery
  // --------------------------------------------------
  if (!images.length) {
    return (
      <section className="py-16 flex items-center justify-center">
        <p className="text-stone-500 text-sm">No images in this gallery yet.</p>
      </section>
    );
  }

  // --------------------------------------------------
  // Render
  // --------------------------------------------------
  return (
    <section className="py-12 sm:py-16 md:py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {heading && (
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-3 sm:mb-4 text-stone-800">
            {heading}
          </h2>
        )}

        {subheading && (
          <p className="text-sm sm:text-base text-center text-stone-600 mb-8 sm:mb-10 md:mb-12 max-w-2xl mx-auto">
            {subheading}
          </p>
        )}

        {/* --- WATERFALL GRID --- */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {visibleImages.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              className="group relative w-full mb-4 break-inside-avoid overflow-hidden rounded-lg shadow-lg bg-stone-100"
              onClick={() => setLightboxIndex(idx)}
            >
              <img
                src={img.thumb_url || img.medium_url || img.public_url}
                alt={img.storage_path.split("/").pop() ?? "Gallery image"}
                className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>

        {/* Infinite loader */}
        {hasMore && (
          <div ref={loaderRef} className="py-10 flex justify-center">
            <span className="text-stone-400 text-sm">Loading more…</span>
          </div>
        )}
      </div>

      {/* --- LIGHTBOX --- */}
      {lightboxIndex !== null && (
        <Lightbox
          images={visibleImages.map((img) => ({
            ...img,
            display_src: img.medium_url || img.public_url,
          }))}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChangeIndex={(newIdx) => setLightboxIndex(newIdx)}
        />
      )}
    </section>
  );
};
