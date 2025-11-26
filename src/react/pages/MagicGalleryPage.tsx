import React from "react";
import { useGalleryByMagicLink } from "../hooks/useGalleryByMagicLink";
import { WaterfallGallery } from "../components/WaterfallGallery";

export interface MagicGalleryPageProps {
  token: string;
  headingOverride?: string;
  subheadingOverride?: string;
}

export const MagicGalleryPage: React.FC<MagicGalleryPageProps> = ({
  token,
  headingOverride,
  subheadingOverride,
}) => {
  const { magicLink, gallery, images, loading, error } =
    useGalleryByMagicLink(token);

  if (loading) {
    return (
      <section className="py-16 flex items-center justify-center">
        <p className="text-stone-500 text-sm">Loading gallery…</p>
      </section>
    );
  }

  if (error || !gallery) {
    return (
      <section className="py-16 flex items-center justify-center">
        <p className="text-stone-500 text-sm">
          {error || "We couldn’t find this gallery."}
        </p>
      </section>
    );
  }

  const heading =
    headingOverride ||
    magicLink?.label ||
    gallery.title ||
    "Your Photo Gallery";

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
