import React from "react";
import { useGalleryData } from "../hooks/useGalleryData";
import { WaterfallGallery } from "../components/WaterfallGallery";

export interface PlayerGalleryPageProps {
  slug: string; // gallery slug (e.g., team folder or player folder slug)
  playerName?: string;
  headingOverride?: string;
  subheadingOverride?: string;
}

export const PlayerGalleryPage: React.FC<PlayerGalleryPageProps> = ({
  slug,
  playerName,
  headingOverride,
  subheadingOverride,
}) => {
  const { gallery, images, loading } = useGalleryData(slug);

  if (loading) {
    return (
      <section className="py-16 flex items-center justify-center">
        <p className="text-stone-500 text-sm">Loading player gallery…</p>
      </section>
    );
  }

  if (!gallery) {
    return (
      <section className="py-16 flex items-center justify-center">
        <p className="text-stone-500 text-sm">
          We couldn’t find this player gallery.
        </p>
      </section>
    );
  }

  const heading =
    headingOverride || playerName || gallery.title || "Player Photo Gallery";

  const subheading =
    subheadingOverride ||
    gallery.description ||
    "Tap any image to view it larger.";

  return (
    <WaterfallGallery
      images={images}
      heading={heading}
      subheading={subheading}
    />
  );
};
