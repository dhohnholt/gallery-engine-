import { listFolders, listImages, ensureDirectLink } from "../lib/dropbox.js";
import { supabaseAdmin } from "../lib/supabase.js";
import type * as types from "../lib/types";

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function prettifyTitle(name: string): string {
  return name
    .replace(/[-_]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function syncFromDropbox(): Promise<void> {
  const rootPath = process.env.DROPBOX_ROOT_PATH || "/";

  console.log("🔄 Starting Dropbox → Supabase sync from:", rootPath);

  const folders = await listFolders(rootPath);
  console.log(`📁 Found ${folders.length} Dropbox folder(s) to sync.`);

  for (const folder of folders) {
    const slug = slugify(folder.name);
    const title = prettifyTitle(folder.name);
    const description = `Photos for ${title}`;
    const dropboxPath = folder.path_lower;

    console.log(`📁 Syncing gallery folder: ${folder.name} (${dropboxPath})`);

    const { data: galleryRow, error: galleryError } = await supabaseAdmin
      .from("galleries")
      .upsert({ slug, title, description }, { onConflict: "slug" })
      .select("*")
      .single();

    if (galleryError) {
      console.error("❌ Error upserting gallery:", galleryError);
      continue;
    }

    const gallery = galleryRow as types.Gallery | null;
    if (!gallery) {
      console.warn("⚠️ Gallery upsert returned no row, skipping:", slug);
      continue;
    }

    const files = await listImages(dropboxPath);
    console.log(`   📸 Found ${files.length} image(s) in "${folder.name}".`);

    let sortIndex = 0;

    for (const file of files) {
      const publicUrl = await ensureDirectLink(file.path_lower);

      const { error: imageError } = await supabaseAdmin
        .from("gallery_images")
        .upsert(
          {
            gallery_id: gallery.id,
            storage_path: file.path_lower,
            public_url: publicUrl,
            size_bytes: file.size,
            display_order: sortIndex,
          },
          { onConflict: "storage_path" }
        );

      if (imageError) {
        console.error(
          `   ⚠️ Error upserting image ${file.name} (${file.path_lower}):`,
          imageError
        );
      } else {
        console.log(`   ✅ Synced ${file.name} → order ${sortIndex}`);
      }

      sortIndex++;
    }
  }

  console.log("🎉 Dropbox → Supabase sync complete.");
}
