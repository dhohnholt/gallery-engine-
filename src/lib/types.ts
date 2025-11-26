export interface Gallery {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  dropbox_path: string;

  // These belong to the *gallery itself*, not per-image
  thumb_url?: string | null;
  medium_url?: string | null;

  width?: number | null;
  height?: number | null;
  size_bytes?: number | null;
  display_order: number;
  created_at: string;
}

// --- FIX THIS ONE ---
export interface GalleryImage {
  id: string;
  gallery_id: string;
  storage_path: string;
  public_url: string;

  // 👇 REQUIRED FIELDS
  thumb_url?: string | null;
  medium_url?: string | null;

  size_bytes: number | null;
  display_order: number | null;
}

export interface MagicLink {
  id: string;
  token: string;
  gallery_id: string;
  expires_at: string | null;
  max_views: number | null;
  view_count: number | null;
}

export interface MagicLinkWithGallery {
  magicLink: MagicLink;
  gallery: Gallery;
  images: GalleryImage[];
}
