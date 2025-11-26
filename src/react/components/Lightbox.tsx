import React, { useEffect, useRef, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { GalleryImage } from "../../lib/types";

export interface LightboxProps {
  images: GalleryImage[];
  index: number;
  onClose: () => void;
  onChangeIndex: (newIndex: number) => void;
}

export const Lightbox: React.FC<LightboxProps> = ({
  images,
  index,
  onClose,
  onChangeIndex,
}) => {
  const current = images[index];
  const startXRef = useRef<number | null>(null);

  if (!current) return null;

  // ----------------------------------------
  // Helpers
  // ----------------------------------------
  const goPrev = useCallback(() => {
    const newIndex = (index - 1 + images.length) % images.length;
    onChangeIndex(newIndex);
  }, [index, images.length, onChangeIndex]);

  const goNext = useCallback(() => {
    const newIndex = (index + 1) % images.length;
    onChangeIndex(newIndex);
  }, [index, images.length, onChangeIndex]);

  // ----------------------------------------
  // Preload prev & next images
  // ----------------------------------------
  useEffect(() => {
    if (!images.length) return;

    const neighbors = [
      (index - 1 + images.length) % images.length,
      (index + 1) % images.length,
    ];

    neighbors.forEach((i) => {
      const img = images[i];
      if (!img) return;
      const src = img.medium_url || img.public_url;
      const pre = new Image();
      pre.src = src;
    });
  }, [index, images]);

  // ----------------------------------------
  // Keyboard shortcuts
  // ----------------------------------------
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, onClose]);

  // Disable body scroll while open
  useEffect(() => {
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = old;
    };
  }, []);

  // ----------------------------------------
  // Swipe gestures (mobile)
  // ----------------------------------------
  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startXRef.current === null) return;

    const endX = e.changedTouches[0]?.clientX ?? startXRef.current;
    const delta = endX - startXRef.current;
    const threshold = 50;

    if (delta > threshold) goPrev();
    else if (delta < -threshold) goNext();

    startXRef.current = null;
  };

  // ----------------------------------------
  // Backdrop click
  // ----------------------------------------
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const src = current.medium_url || current.public_url;
  const alt = current.storage_path.split("/").pop() ?? "Gallery image";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 sm:p-8 animate-fadeIn"
      onClick={handleBackdropClick}
    >
      {/* Close Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 text-white hover:text-amber-400 transition-colors p-2"
        aria-label="Close"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-4 text-white hover:text-amber-400 transition-colors p-3 bg-black/40 rounded-full hover:bg-black/60"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-10 h-10" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-4 text-white hover:text-amber-400 transition-colors p-3 bg-black/40 rounded-full hover:bg-black/60"
            aria-label="Next image"
          >
            <ChevronRight className="w-10 h-10" />
          </button>
        </>
      )}

      {/* Main Image */}
      <div
        className="relative w-full h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          key={current.id} // Forces fade animation when switching images
          src={src}
          alt={alt}
          className="max-h-[90vh] max-w-full object-contain transition-opacity duration-300 animate-fadeImage"
        />
      </div>

      {/* Counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">
        {index + 1} / {images.length}
      </div>
    </div>
  );
};
