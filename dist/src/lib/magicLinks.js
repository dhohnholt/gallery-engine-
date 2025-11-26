// src/lib/magicLinks.ts
import { supabaseAnon } from "./supabaseClient.js";
export async function getGalleryForMagicToken(token) {
    const { data: magicRow, error: magicError } = await supabaseAnon
        .from("magic_links")
        .select("*")
        .eq("token", token)
        .maybeSingle();
    if (magicError) {
        console.error("[gallery-engine] Error fetching magic link:", magicError);
        throw magicError;
    }
    if (!magicRow) {
        return null;
    }
    const { data: galleryRow, error: galleryError } = await supabaseAnon
        .from("galleries")
        .select("*")
        .eq("id", magicRow.gallery_id)
        .maybeSingle();
    if (galleryError) {
        console.error("[gallery-engine] Error fetching gallery for magic link:", galleryError);
        throw galleryError;
    }
    if (!galleryRow) {
        return null;
    }
    const { data: imageRows, error: imageError } = await supabaseAnon
        .from("gallery_images")
        .select("*")
        .eq("gallery_id", magicRow.gallery_id)
        .order("display_order", { ascending: true });
    if (imageError) {
        console.error("[gallery-engine] Error fetching images for magic link:", imageError);
        throw imageError;
    }
    return {
        magicLink: magicRow,
        gallery: galleryRow,
        images: (imageRows || []),
    };
}
//# sourceMappingURL=magicLinks.js.map