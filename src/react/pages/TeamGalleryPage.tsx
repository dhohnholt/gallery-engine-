import React from "react";
import { useGalleryData } from "../hooks/useGalleryData";
import { WaterfallGallery } from "../components/WaterfallGallery";

export interface TeamGalleryPageProps {
  slug: string;
  headingOverride?: string;
  subheadingOverride?: string;
}

export const TeamGalleryPage: React.FC<TeamGalleryPageProps> = ({
  slug,
  headingOverride,
  subheadingOverride,
}) => {
  const { gallery, images, loading, error } = useGalleryData(slug);

  // -----------------------------
  // Loading State
  // -----------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-neutral-400 tracking-wide animate-pulse">
          Loading team gallery…
        </p>
      </div>
    );
  }

  // -----------------------------
  // Error / Not Found
  // -----------------------------
  if (error || !gallery) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-neutral-500">{error || "Team gallery not found."}</p>
      </div>
    );
  }

  // -----------------------------
  // Titles
  // -----------------------------
  const heading = headingOverride || gallery.title || "Team Gallery";
  const subheading =
    subheadingOverride ||
    gallery.description ||
    "Tap any image to view it larger.";

  // -----------------------------
  // Background Hero (Pixieset style)
  // -----------------------------
  const heroImage = images.length > 0 ? images[0].public_url : null;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* HERO SECTION */}
      <div className="relative w-full h-[45vh] max-h-[480px] overflow-hidden">
        {heroImage && (
          <>
            <img
              src={heroImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-40 blur-lg scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black" />
          </>
        )}

        {/* Title block */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl md:text-5xl font-light tracking-wide drop-shadow-lg">
            {heading}
          </h1>
          <p className="mt-4 text-neutral-300 max-w-xl text-sm md:text-base font-light">
            {subheading}
          </p>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Divider glow */}
        <div className="h-px w-full bg-gradient-to-r from-black via-neutral-700/40 to-black mb-12" />

        {/* Gallery */}
        <WaterfallGallery
          images={images}
          heading={undefined} // hide built-in heading for this page
          subheading={undefined}
        />
      </div>
    </div>
  );
};
