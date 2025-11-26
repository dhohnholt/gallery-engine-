import type { Gallery, GalleryImage } from "./types";
export interface GalleryResult {
    gallery: Gallery | null;
    images: GalleryImage[];
}
export declare function getGalleryBySlug(slug: string): Promise<GalleryResult>;
//# sourceMappingURL=galleries.d.ts.map