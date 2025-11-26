import { useEffect, useState } from "react";
import { supabaseAnon } from "../../lib/supabaseClient";
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
        // 1) Find the gallery by slug
        const { data: galleryRow, error: galleryError } = await supabaseAnon
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

        // 2) Load its images
        const { data: imageRows, error: imagesError } = await supabaseAnon
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
        if (!cancelled) {
          console.error("[useGalleryData] Error loading gallery:", err);
          setError(err.message || "Error loading gallery.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { gallery, images, loading, error };
}
