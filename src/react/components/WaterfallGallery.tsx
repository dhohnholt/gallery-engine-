import React, { useState } from "react";
import type { GalleryImage } from "../../lib/types";
import { Lightbox } from "./Lightbox";

export interface WaterfallGalleryProps {
  images: GalleryImage[];
  heading?: string;
  subheading?: string;
}

export const WaterfallGallery: React.FC<WaterfallGalleryProps> = ({
  images,
  heading,
  subheading,
}) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!images.length) {
    return (
      <section className="py-16 flex items-center justify-center">
        <p className="text-stone-500 text-sm">No images in this gallery yet.</p>
      </section>
    );
  }

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

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {images.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              className="group relative w-full mb-4 break-inside-avoid overflow-hidden rounded-lg shadow-lg bg-stone-100"
              onClick={() => setLightboxIndex(idx)}
            >
              <img
                src={img.public_url}
                alt={img.title ?? "Gallery image"}
                className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChangeIndex={(newIdx) => setLightboxIndex(newIdx)}
        />
      )}
    </section>
  );
};
