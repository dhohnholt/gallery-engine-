// src/sync/syncFromDropbox.ts

import { listFolders, listImages, getPublicUrl } from "../lib/dropbox";
import { supabaseAdmin } from "../lib/supabaseClient";

export async function syncFromDropbox(): Promise<void> {
  const rootPath = process.env.DROPBOX_ROOT_PATH || "/";

  console.log(`[gallery-engine] Syncing from root path: ${rootPath}`);

  const folders = await listFolders(rootPath);

  console.log(`[gallery-engine] Found ${folders.length} Dropbox folders.`);

  for (const folder of folders) {
    console.log(
      `📁 Syncing gallery folder: ${folder.name} (${folder.path_lower})`
    );

    const slug = folder.name.toLowerCase().replace(/\s+/g, "-");

    // 1. Upsert gallery
    const { data: galleryRow, error: galleryError } = await supabaseAdmin
      .from("galleries")
      .upsert(
        {
          slug,
          title: folder.name,
          dropbox_path: folder.path_lower,
        },
        { onConflict: "slug" }
      )
      .select()
      .single();

    if (galleryError) {
      console.error("❌ Error upserting gallery:", galleryError);
      continue;
    }

    const galleryId = (galleryRow as any).id as string;

    // 2. List image files in that folder
    const files = await listImages(folder.path_lower);
    console.log(`   → ${files.length} image files found.`);

    let order = 0;

    for (const file of files) {
      const publicUrl = await getPublicUrl(file.path_lower);

      const { error: imgError } = await supabaseAdmin
        .from("gallery_images")
        .upsert(
          {
            gallery_id: galleryId,
            storage_path: file.path_lower,
            public_url: publicUrl,
            size_bytes: file.size,
            display_order: order++,
          },
          { onConflict: "storage_path" }
        );

      if (imgError) {
        console.error(
          `   ❌ Error upserting image for ${file.path_lower}:`,
          imgError
        );
      }
    }

    console.log(
      `✅ Synced ${files.length} images for gallery "${folder.name}" (slug: ${slug})`
    );
  }

  console.log("🎉 Dropbox → Supabase sync complete.");
}
