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

  if (loading) {
    return (
      <section className="py-16 flex items-center justify-center">
        <p className="text-stone-500 text-sm">Loading team gallery…</p>
      </section>
    );
  }

  if (error || !gallery) {
    return (
      <section className="py-16 flex items-center justify-center">
        <p className="text-stone-500 text-sm">
          {error || "We couldn’t find this team gallery."}
        </p>
      </section>
    );
  }

  const heading = headingOverride || gallery.title || "Team Gallery";
  const subheading =
    subheadingOverride ||
    gallery.description ||
    "Scroll through the photos and tap any image to enlarge.";

  return (
    <WaterfallGallery
      images={images}
      heading={heading}
      subheading={subheading}
    />
  );
};
