import {
  ensureDirectLink,
  listFolders,
  listImages,
  normalizeRootPath,
  resolveDropboxRootPath,
} from "../lib/dropbox.js";
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
    .replace(/\b\w/g, (c: string) => c.toUpperCase());
}

export async function syncFromDropbox() {
  const normalizedRootPath = normalizeRootPath(process.env.DROPBOX_ROOT_PATH);

  if (!normalizedRootPath) {
    throw new Error(
      "Refusing to sync entire Dropbox. Set DROPBOX_ROOT_PATH to a valid folder (e.g. /Triple-H-Media)."
    );
  }

  const rootPath = resolveDropboxRootPath();

  console.log("Syncing only:", normalizedRootPath);
  console.log("🔄 Starting Dropbox → Supabase sync from:", rootPath);

  const folders = await listFolders(rootPath);
  console.log(`📁 Found ${folders.length} Dropbox folder(s) to sync.`);

  for (const folder of folders) {
    const slug = slugify(folder.name);
    const title = prettifyTitle(folder.name);
    const description = `Photos for ${title}`;
    const dropboxPath = folder.path_lower;

    console.log(`\n📁 Syncing gallery: ${folder.name} (${dropboxPath})`);

    // --- Upsert gallery ---
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

    // 🔍 GET ALL FILES (recursive)
    const files = await listImages(dropboxPath);
    console.log(
      `   📸 Found ${files.length} images (recursive) in "${folder.name}".`
    );

    let sortIndex = 0;

    for (const file of files) {
      // Check existing DB row
      const { data: existingRows } = await supabaseAdmin
        .from("gallery_images")
        .select("id, rev")
        .eq("storage_path", file.path_lower)
        .limit(1);

      const existing = existingRows?.[0];

      // --- Skip unchanged ---
      if (existing && existing.rev === file.rev) {
        console.log(`   ⏭️ Skipped (unchanged): ${file.name}`);
        sortIndex++;
        continue;
      }

      // Ensure direct Dropbox link
      const publicUrl = await ensureDirectLink(file.path_lower);

      // Upsert new/updated image
      const { error: imageError } = await supabaseAdmin
        .from("gallery_images")
        .upsert(
          {
            id: existing?.id, // reuse existing row if present
            gallery_id: gallery.id,
            storage_path: file.path_lower,
            public_url: publicUrl,
            size_bytes: file.size,
            rev: file.rev, // 🔥 update revision
            display_order: sortIndex,
          },
          { onConflict: "storage_path" }
        );

      if (imageError) {
        console.error(`   ⚠️ Error syncing ${file.name}:`, imageError);
      } else {
        const action = existing ? "🔄 Updated" : "✅ Added";
        console.log(`   ${action} ${file.name} → order ${sortIndex}`);
      }

      sortIndex++;
    }
  }

  console.log("\n🎉 Dropbox → Supabase sync complete.");
}
