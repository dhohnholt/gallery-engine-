import { useEffect, useState } from "react";
import { supabaseAnon } from "../../lib/supabaseClient";
import type { Gallery, GalleryImage, MagicLink } from "../../lib/types";

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
        // 1) Resolve magic link
        const { data: linkRow, error: linkError } = await supabaseAnon
          .from("magic_links")
          .select("*")
          .eq("token", token)
          .maybeSingle();

        if (linkError) throw linkError;

        if (!linkRow) {
          if (!cancelled) {
            setMagicLink(null);
            setGallery(null);
            setImages([]);
            setError("Magic link not found or expired.");
          }
          return;
        }

        const linkTyped = linkRow as MagicLink;

        // Optional: check expires_at if you want to enforce expiry client-side
        if (linkTyped.expires_at) {
          const now = new Date();
          const expires = new Date(linkTyped.expires_at);
          if (expires.getTime() < now.getTime()) {
            if (!cancelled) {
              setMagicLink(linkTyped);
              setGallery(null);
              setImages([]);
              setError("This link has expired.");
            }
            return;
          }
        }

        // 2) Load gallery
        const { data: galleryRow, error: galleryError } = await supabaseAnon
          .from("galleries")
          .select("*")
          .eq("id", linkTyped.gallery_id)
          .maybeSingle();

        if (galleryError) throw galleryError;
        if (!galleryRow) {
          if (!cancelled) {
            setMagicLink(linkTyped);
            setGallery(null);
            setImages([]);
            setError("Gallery for this link was not found.");
          }
          return;
        }

        const galleryTyped = galleryRow as Gallery;

        // 3) Load images
        const { data: imageRows, error: imagesError } = await supabaseAnon
          .from("gallery_images")
          .select("*")
          .eq("gallery_id", galleryTyped.id)
          .order("display_order", { ascending: true });

        if (imagesError) throw imagesError;

        if (!cancelled) {
          setMagicLink(linkTyped);
          setGallery(galleryTyped);
          setImages((imageRows || []) as GalleryImage[]);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("[useGalleryByMagicLink] Error:", err);
          setError(err.message || "Error loading gallery from magic link.");
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
  }, [token]);

  return { magicLink, gallery, images, loading, error };
}
