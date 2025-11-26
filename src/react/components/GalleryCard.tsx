import React from "react";

export interface GalleryCardProps {
  title: string;
  description?: string | null;
  coverUrl: string;
  href?: string;
  onClick?: () => void;
  imageCount?: number;
  badgeText?: string;
}

export const GalleryCard: React.FC<GalleryCardProps> = ({
  title,
  description,
  coverUrl,
  href,
  onClick,
  imageCount,
  badgeText,
}) => {
  const Tag = href ? "a" : "button";

  return (
    <Tag
      href={href}
      onClick={href ? undefined : onClick}
      className="block group overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-shadow bg-white border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        <img
          src={coverUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {badgeText && (
          <div className="absolute top-2 left-2 bg-amber-600 text-white text-xs font-semibold px-2 py-1 rounded-full shadow">
            {badgeText}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-stone-800 mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-stone-600 mb-2 line-clamp-2">
            {description}
          </p>
        )}
        {typeof imageCount === "number" && (
          <p className="text-xs text-stone-500">
            {imageCount} photo{imageCount === 1 ? "" : "s"}
          </p>
        )}
      </div>
    </Tag>
  );
};
