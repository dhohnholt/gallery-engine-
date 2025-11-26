// src/lib/galleries.ts

import { supabaseAnon } from "./supabaseClient.js";
import type { Gallery, GalleryImage } from "./types";

export interface GalleryResult {
  gallery: Gallery | null;
  images: GalleryImage[];
}

export async function getGalleryBySlug(slug: string): Promise<GalleryResult> {
  const { data: galleryRow, error: galleryError } = await supabaseAnon
    .from("galleries")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (galleryError) {
    console.error("[gallery-engine] Error fetching gallery:", galleryError);
    throw galleryError;
  }

  if (!galleryRow) {
    return { gallery: null, images: [] };
  }

  const { data: imageRows, error: imageError } = await supabaseAnon
    .from("gallery_images")
    .select("*")
    .eq("gallery_id", (galleryRow as any).id)
    .order("display_order", { ascending: true });

  if (imageError) {
    console.error(
      "[gallery-engine] Error fetching gallery images:",
      imageError
    );
    throw imageError;
  }

  return {
    gallery: galleryRow as Gallery,
    images: (imageRows || []) as GalleryImage[],
  };
}
