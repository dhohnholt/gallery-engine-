// src/lib/dropbox.ts
import { Dropbox } from "dropbox";
import fetch from "node-fetch";
const DROPBOX_ACCESS_TOKEN = process.env.DROPBOX_ACCESS_TOKEN;
if (!DROPBOX_ACCESS_TOKEN) {
  throw new Error("Missing DROPBOX_ACCESS_TOKEN in environment");
}
const dbx = new Dropbox({
  accessToken: DROPBOX_ACCESS_TOKEN,
  fetch: fetch,
});
// List subfolders under a root path
export async function listFolders(rootPath) {
  const res = await dbx.filesListFolder({ path: rootPath });
  const folders = res.result.entries.filter((e) => e[".tag"] === "folder");
  return folders.map((f) => ({
    name: f.name,
    path_lower: f.path_lower,
  }));
}
// List image files (jpg, png, webp, heic, etc.) in a folder
export async function listImages(folderPath) {
  const res = await dbx.filesListFolder({ path: folderPath });
  const files = res.result.entries.filter((e) => e[".tag"] === "file");
  return files
    .filter((file) => /\.(jpe?g|png|webp|heic|gif)$/i.test(file.name))
    .map((file) => ({
      name: file.name,
      path_lower: file.path_lower,
      size: file.size,
    }));
}
// Get or create a permanent direct link for a file
export async function ensureCreateDirectLink(pathLower) {
  // 1) Try to reuse existing shared link
  try {
    const links = await dbx.sharingListSharedLinks({
      path: pathLower,
      direct_only: true,
    });
    if (links.result.links.length > 0) {
      return normalizeDropboxUrl(links.result.links[0].url);
    }
  } catch (err) {
    console.warn("No existing shared link, will create a new one:", err);
  }
  // 2) Create a new shared link
  const created = await dbx.sharingCreateSharedLinkWithSettings({
    path: pathLower,
    settings: {
      // Type-safe-ish: the SDK expects a RequestedVisibility object
      // We just force public visibility.
      requested_visibility: { ".tag": "public" },
    },
  });
  return normalizeDropboxUrl(created.result.url);
}
// Turn a "www.dropbox.com/s/<id>?dl=0" into a proper direct link
function normalizeDropboxUrl(url) {
  // Typical URLs look like:
  // https://www.dropbox.com/s/xxxx/file.jpg?dl=0
  // We want a direct "download"/raw URL that works well in <img src="">
  if (url.includes("dl=0")) {
    url = url.replace("dl=0", "raw=1");
  } else if (!url.includes("raw=1") && !url.includes("dl=1")) {
    const separator = url.includes("?") ? "&" : "?";
    url = `${url}${separator}raw=1`;
  }
  // Optional: convert www.dropbox.com → dl.dropboxusercontent.com
  url = url.replace("www.dropbox.com", "dl.dropboxusercontent.com");
  return url;
}
//# sourceMappingURL=dropbox.js.map
