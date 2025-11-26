import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

// IMPORTANT — Use browser-safe shared types
import type { Gallery, GalleryImage, MagicLink } from "../types"; // <-- NEW (React-safe types)

export interface UseGalleryByMagicLinkResult {
  magicLink: MagicLink | null;
  gallery: Gallery | null;
  images: GalleryImage[];
  loading: boolean;
  error: string | null;
}

export function useGalleryByMagicLink(
  token: string | null | undefined
): UseGalleryByMagicLinkResult {
  const [magicLink, setMagicLink] = useState<MagicLink | null>(null);
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState<boolean>(!!token);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setMagicLink(null);
      setGallery(null);
      setImages([]);
      setLoading(false);
      setError("No magic link token provided.");
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // 1) Load MAGIC LINK
        const { data: linkRow, error: linkError } = await supabase
          .from("magic_links")
          .select("*")
          .eq("token", token)
          .maybeSingle();

        if (linkError) throw linkError;

        if (!linkRow) {
          if (!cancelled) {
            setError("Magic link not found or expired.");
          }
          return;
        }

        const link = linkRow as MagicLink;

        // Optional expiry enforcement
        if (link.expires_at) {
          const expires = new Date(link.expires_at);
          if (expires.getTime() < Date.now()) {
            if (!cancelled) {
              setMagicLink(link);
              setError("This link has expired.");
            }
            return;
          }
        }

        // 2) Load GALLERY
        const { data: galleryRow, error: galleryError } = await supabase
          .from("galleries")
          .select("*")
          .eq("id", link.gallery_id)
          .maybeSingle();

        if (galleryError) throw galleryError;

        if (!galleryRow) {
          if (!cancelled) {
            setMagicLink(link);
            setError("Gallery not found.");
          }
          return;
        }

        const gallery = galleryRow as Gallery;

        // 3) Load IMAGES
        const { data: imageRows, error: imagesError } = await supabase
          .from("gallery_images")
          .select("*")
          .eq("gallery_id", gallery.id)
          .order("display_order", { ascending: true });

        if (imagesError) throw imagesError;

        if (!cancelled) {
          setMagicLink(link);
          setGallery(gallery);
          setImages((imageRows || []) as GalleryImage[]);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("[useGalleryByMagicLink] Error:", err);
          setError(err.message || "Error loading gallery.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return { magicLink, gallery, images, loading, error };
}
