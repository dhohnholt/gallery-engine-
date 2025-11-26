import React from "react";
import { useGalleryData } from "../hooks/useGalleryData";
import { WaterfallGallery } from "../components/WaterfallGallery";

export interface PlayerGalleryPageProps {
  slug: string;
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
  const { gallery, images, loading, error } = useGalleryData(slug);

  if (loading) {
    return (
      <section className="py-16 flex items-center justify-center">
        <p className="text-stone-500 text-sm">Loading player gallery…</p>
      </section>
    );
  }

  if (error || !gallery) {
    return (
      <section className="py-16 flex items-center justify-center">
        <p className="text-stone-500 text-sm">
          {error || "We couldn’t find this player gallery."}
        </p>
      </section>
    );
  }

  const heading =
    headingOverride ||
    (playerName
      ? `${playerName} — Photo Gallery`
      : gallery.title || "Player Gallery");

  const subheading =
    subheadingOverride ||
    gallery.description ||
    "Tap any image to see it larger and swipe through.";

  return (
    <WaterfallGallery
      images={images}
      heading={heading}
      subheading={subheading}
    />
  );
};
