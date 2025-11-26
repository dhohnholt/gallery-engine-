// ------------------------------------------------------------
// Shared React-Safe Types for Gallery Engine
// These are duplicated front-end shapes of your DB schema,
// safe for use inside Vite/React (no Node, no server imports).
// ------------------------------------------------------------

export interface MagicLink {
  id: string;
  token: string;
  gallery_id: string;

  // Optional label shown in gallery headers
  label?: string | null;

  // Optional expiration
  expires_at?: string | null;

  created_at?: string;
}

export interface Gallery {
  id: string;
  slug: string;
  title: string;
  description: string | null;

  created_at?: string;
}

export interface GalleryImage {
  id: string;
  gallery_id: string;
  storage_path: string;
  public_url: string;

  // Sorting / display
  display_order: number;

  // Metadata
  size_bytes: number | null;
  width?: number | null;
  height?: number | null;

  created_at?: string;
}
