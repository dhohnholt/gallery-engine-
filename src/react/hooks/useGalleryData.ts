import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import type { Gallery, GalleryImage } from "../../lib/types";

export interface UseGalleryDataResult {
  gallery: Gallery | null;
  images: GalleryImage[];
  loading: boolean;
  error: string | null;
}

export function useGalleryData(
  slug: string | null | undefined
): UseGalleryDataResult {
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState<boolean>(!!slug);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setGallery(null);
      setImages([]);
      setLoading(false);
      setError("No gallery slug provided.");
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // 1) Load gallery by slug
        const { data: galleryRow, error: galleryError } = await supabase
          .from("galleries")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();

        if (galleryError) throw galleryError;

        if (!galleryRow) {
          if (!cancelled) {
            setGallery(null);
            setImages([]);
            setError("Gallery not found.");
          }
          return;
        }

        const galleryTyped = galleryRow as Gallery;

        // 2) Load images for this gallery
        const { data: imageRows, error: imagesError } = await supabase
          .from("gallery_images")
          .select("*")
          .eq("gallery_id", galleryTyped.id)
          .order("display_order", { ascending: true });

        if (imagesError) throw imagesError;

        if (!cancelled) {
          setGallery(galleryTyped);
          setImages((imageRows || []) as GalleryImage[]);
        }
      } catch (err: any) {
        console.error("[useGalleryData] Error:", err);
        if (!cancelled) {
          setError(err.message || "Error loading gallery.");
          setGallery(null);
          setImages([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { gallery, images, loading, error };
}
