// src/lib/dropbox.ts
import { Dropbox } from "dropbox";
import fetch from "node-fetch";
import { getDropboxAccessToken } from "./dropboxAuth.js";

export const normalizeRootPath = (value?: string | null): string => {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") {
    return "";
  }

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

const ensureWithinRoot = (value: string): string => {
  const normalized = normalizeRootPath(value);

  if (!normalized) {
    throw new Error("Dropbox path cannot be empty.");
  }

  if (!normalized.toLowerCase().startsWith(dropboxRootPathLower)) {
    throw new Error(
      `Attempted to walk outside root path "${dropboxRootPath}" with "${value}".`
    );
  }

  return normalized;
};

export const resolveDropboxRootPath = (override?: string): string => {
  if (override) {
    return ensureWithinRoot(override);
  }

  return dropboxRootPath;
};

// Extensions you allow — unchanged
const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

// ---------------------------------------------
// INTERNAL: build a fresh Dropbox client
// ---------------------------------------------
async function makeClient() {
  const token = await getDropboxAccessToken(); // <-- FIXED
  return new Dropbox({
    accessToken: token,
    fetch: fetch as any,
  });
}

// ---------------------------------------------
// INTERNAL: wrap all Dropbox calls with auto-refresh
// ---------------------------------------------
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

// ---------------------------------------------
// Convert Dropbox shared link → direct raw URL
// ---------------------------------------------
function toDirectUrl(sharedUrl: string): string {
  if (sharedUrl.includes("dl=0")) return sharedUrl.replace("dl=0", "raw=1");
  if (sharedUrl.includes("?")) return `${sharedUrl}&raw=1`;
  return `${sharedUrl}?raw=1`;
}

// ---------------------------------------------
// Check if error is “shared link already exists”
// ---------------------------------------------
function isLinkExistsError(error: unknown): boolean {
  const err = error as Record<string, any>;
  const inner = err?.error?.error ?? err?.error?.value ?? err;

  return (
    inner?.shared_link_already_exists === true ||
    inner?.error_summary?.includes("shared_link_already_exists") ||
    inner?.error?.shared_link_already_exists === true
  );
}

// ---------------------------------------------
// Try to load existing shared link
// ---------------------------------------------
async function getExistingSharedLink(client: Dropbox, path: string) {
  const targetPath = ensureWithinRoot(path);

  const links = await client.sharingListSharedLinks({
    path: targetPath,
    direct_only: true,
  });

  const url = links.result?.links?.[0]?.url;
  return url ? toDirectUrl(url) : null;
}

// ---------------------------------------------
// PUBLIC: List folders
// ---------------------------------------------
export async function listFolders(
  rootPath?: string
): Promise<{ id: string; name: string; path_lower: string }[]> {
  const resolvedRootPath = rootPath
    ? ensureWithinRoot(rootPath)
    : dropboxRootPath;

  return withRetry(async (client) => {
    const response = await client.filesListFolder({
      path: resolvedRootPath,
      recursive: false,
    });

    const entries = response.result?.entries ?? [];

    return entries
      .filter((e) => e[".tag"] === "folder")
      .map((entry: any) => {
        const folderPath = entry.path_lower ?? entry.path_display;

        if (!folderPath) {
          throw new Error("Dropbox folder entry missing path.");
        }

        return {
          id: entry.id,
          name: entry.name,
          path_lower: ensureWithinRoot(folderPath),
        };
      });
  });
}

// ---------------------------------------------
// PUBLIC: List images inside a Dropbox folder
// ---------------------------------------------
export async function listImages(folderPath: string) {
  const targetFolderPath = ensureWithinRoot(folderPath);

  return withRetry(async (client) => {
    const response = await client.filesListFolder({
      path: targetFolderPath,
      recursive: false,
    });

    const entries = response.result?.entries ?? [];

    return entries
      .filter((e) => e[".tag"] === "file")
      .filter((e) =>
        allowedExtensions.some((ext) =>
          (e.name as string).toLowerCase().endsWith(ext)
        )
      )
      .map((entry: any) => {
        const filePath = entry.path_lower ?? entry.path_display;

        if (!filePath) {
          throw new Error("Dropbox file entry missing path.");
        }

        return {
          id: entry.id,
          name: entry.name,
          path_lower: ensureWithinRoot(filePath),
          size: entry.size,
        };
      });
  });
}

// ---------------------------------------------
// PUBLIC: Ensure a DIRECT downloadable Dropbox URL
// ---------------------------------------------
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

      const url = created.result.url as string;
      return toDirectUrl(url);
    } catch (err) {
      if (isLinkExistsError(err)) {
        const fallback = await getExistingSharedLink(client, targetPath);
        if (fallback) return fallback;
      }

      throw err;
    }
  });
}
