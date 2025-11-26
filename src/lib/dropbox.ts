// src/lib/dropbox.ts
import { Dropbox } from "dropbox";
import fetch from "node-fetch";
import { getDropboxAccessToken } from "./dropboxAuth.js";

/* ---------------------------------------------
   NORMALIZE ROOT PATH
--------------------------------------------- */
export const normalizeRootPath = (value?: string | null): string => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") return "";

  let normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.replace(/\/+$/, "");
  }
  return normalized;
};

const dropboxRootPath = normalizeRootPath(process.env.DROPBOX_ROOT_PATH);

if (!dropboxRootPath) {
  throw new Error(
    "Refusing to sync entire Dropbox. Set DROPBOX_ROOT_PATH to a valid folder (e.g. /Triple-H-Media)."
  );
}

const dropboxRootPathLower = dropboxRootPath.toLowerCase();

/* ---------------------------------------------
   VALIDATE PATHS
--------------------------------------------- */
const ensureWithinRoot = (value: string): string => {
  const normalized = normalizeRootPath(value);
  if (!normalized) throw new Error("Dropbox path cannot be empty.");

  if (!normalized.toLowerCase().startsWith(dropboxRootPathLower)) {
    throw new Error(
      `Attempted to walk outside root path "${dropboxRootPath}" with "${value}".`
    );
  }
  return normalized;
};

export const resolveDropboxRootPath = (override?: string): string => {
  return override ? ensureWithinRoot(override) : dropboxRootPath;
};

/* ---------------------------------------------
   ALLOWED IMAGE EXTENSIONS
--------------------------------------------- */
const allowedExtensions = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".bmp",
  ".tif",
  ".heic",
];

/* ---------------------------------------------
   CLIENT CREATION + TOKEN REFRESH
--------------------------------------------- */
async function makeClient() {
  const token = await getDropboxAccessToken();
  return new Dropbox({
    accessToken: token,
    fetch: fetch as any,
  });
}

async function withRetry<T>(fn: (client: Dropbox) => Promise<T>): Promise<T> {
  let client = await makeClient();
  try {
    return await fn(client);
  } catch (err: any) {
    const tag =
      err?.error?.error?.[".tag"] ?? err?.error?.[".tag"] ?? err?.error_summary;

    const expired =
      tag === "expired_access_token" || tag?.includes("expired_access_token");

    if (!expired) throw err;

    console.warn("🔁 Dropbox token expired — refreshing…");
    client = await makeClient();
    return await fn(client);
  }
}

/* ---------------------------------------------
   SHARED-LINK CONVERSION
--------------------------------------------- */
function toDirectUrl(sharedUrl: string): string {
  if (sharedUrl.includes("dl=0")) return sharedUrl.replace("dl=0", "raw=1");
  if (sharedUrl.includes("?")) return `${sharedUrl}&raw=1`;
  return `${sharedUrl}?raw=1`;
}

function isLinkExistsError(error: unknown): boolean {
  const err = error as Record<string, any>;
  const inner = err?.error?.error ?? err?.error?.value ?? err;
  return (
    inner?.shared_link_already_exists === true ||
    inner?.error_summary?.includes("shared_link_already_exists") ||
    inner?.error?.shared_link_already_exists === true
  );
}

async function getExistingSharedLink(client: Dropbox, path: string) {
  const links = await client.sharingListSharedLinks({
    path,
    direct_only: true,
  });

  const url = links.result?.links?.[0]?.url;
  return url ? toDirectUrl(url) : null;
}

/* ---------------------------------------------
   PUBLIC: LIST TOP-LEVEL FOLDERS ONLY
--------------------------------------------- */
export async function listFolders(
  rootPath?: string
): Promise<{ id: string; name: string; path_lower: string }[]> {
  const resolvedRootPath = rootPath
    ? ensureWithinRoot(rootPath)
    : dropboxRootPath;

  return withRetry(async (client) => {
    const response = await client.filesListFolder({
      path: resolvedRootPath,
      recursive: false, // <-- STAYS FALSE so we don't create nested galleries!
    });

    const entries = response.result?.entries ?? [];
    return entries
      .filter((e) => e[".tag"] === "folder")
      .map((entry: any) => ({
        id: entry.id,
        name: entry.name,
        path_lower: ensureWithinRoot(entry.path_lower),
      }));
  });
}

/* ---------------------------------------------
   PUBLIC: RECURSIVE IMAGE SCANNING
   WITH PAGINATION SUPPORT
--------------------------------------------- */
export async function listImages(folderPath: string) {
  const targetFolderPath = ensureWithinRoot(folderPath);

  return withRetry(async (client) => {
    let entries: any[] = [];

    // Initial request
    let response = await client.filesListFolder({
      path: targetFolderPath,
      recursive: true,
    });

    entries = [...entries, ...(response.result?.entries ?? [])];

    // Pagination support
    while (response.result?.has_more) {
      response = await client.filesListFolderContinue({
        cursor: response.result.cursor,
      });
      entries = [...entries, ...(response.result?.entries ?? [])];
    }

    return entries
      .filter((e) => e[".tag"] === "file")
      .filter((e) =>
        allowedExtensions.some((ext) =>
          e.name.toLowerCase().endsWith(ext.toLowerCase())
        )
      )
      .map((entry: any) => {
        const filePath = entry.path_lower ?? entry.path_display;
        if (!filePath) throw new Error("Dropbox file entry missing path.");

        return {
          id: entry.id,
          name: entry.name,
          path_lower: ensureWithinRoot(filePath),
          size: entry.size,
          rev: entry.rev,
        };
      });
  });
}

/* ---------------------------------------------
   PUBLIC: ENSURE DIRECT LINK
--------------------------------------------- */
export async function ensureDirectLink(filePath: string): Promise<string> {
  const targetPath = ensureWithinRoot(filePath);

  return withRetry(async (client) => {
    const existing = await getExistingSharedLink(client, targetPath);
    if (existing) return existing;

    try {
      const created = await client.sharingCreateSharedLinkWithSettings({
        path: targetPath,
        settings: { requested_visibility: "public" } as any,
      });

      return toDirectUrl(created.result.url);
    } catch (err) {
      if (isLinkExistsError(err)) {
        const fallback = await getExistingSharedLink(client, targetPath);
        if (fallback) return fallback;
      }
      throw err;
    }
  });
}
