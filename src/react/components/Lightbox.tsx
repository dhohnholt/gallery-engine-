import React from "react";
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
  const img = images[index];

  if (!img) return null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newIndex = (index - 1 + images.length) % images.length;
    onChangeIndex(newIndex);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newIndex = (index + 1) % images.length;
    onChangeIndex(newIndex);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
      onClick={onClose}
    >
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

      {images.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 text-white hover:text-amber-400 transition-colors p-3 bg-black/50 rounded-full hover:bg-black/70"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 text-white hover:text-amber-400 transition-colors p-3 bg-black/50 rounded-full hover:bg-black/70"
            aria-label="Next image"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}

      <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-8">
        <img
          src={img.public_url}
          alt={img.storage_path.split("/").pop() ?? "Gallery image"}
          className="max-w-full max-h-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
        {index + 1} / {images.length}
      </div>
    </div>
  );
};
