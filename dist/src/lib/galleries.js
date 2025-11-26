// src/lib/galleries.ts
import { supabaseAnon } from "./supabaseClient.js";
export async function getGalleryBySlug(slug) {
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
        .eq("gallery_id", galleryRow.id)
        .order("display_order", { ascending: true });
    if (imageError) {
        console.error("[gallery-engine] Error fetching gallery images:", imageError);
        throw imageError;
    }
    return {
        gallery: galleryRow,
        images: (imageRows || []),
    };
}
//# sourceMappingURL=galleries.js.map