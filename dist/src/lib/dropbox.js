import { Dropbox } from "dropbox";
import fetch from "node-fetch";
const accessToken = process.env.DROPBOX_ACCESS_TOKEN;
const rootPathEnv = process.env.DROPBOX_ROOT_PATH || "/";
if (!accessToken) {
    throw new Error("DROPBOX_ACCESS_TOKEN is not set in environment variables");
}
const client = new Dropbox({
    accessToken,
    fetch: fetch,
});
function toDirectUrl(sharedUrl) {
    if (sharedUrl.includes("dl=0")) {
        return sharedUrl.replace("dl=0", "raw=1");
    }
    if (sharedUrl.includes("?")) {
        return `${sharedUrl}&raw=1`;
    }
    return `${sharedUrl}?raw=1`;
}
async function getExistingSharedLink(path) {
    const links = await client.sharingListSharedLinks({
        path,
        direct_only: true,
    });
    const url = links.result?.links?.[0]?.url;
    return url ? toDirectUrl(url) : null;
}
function isLinkExistsError(error) {
    const err = error;
    const inner = err?.error?.error ?? err?.error?.value ?? err;
    return (inner?.shared_link_already_exists === true ||
        inner?.error_summary?.includes("shared_link_already_exists") ||
        inner?.error?.shared_link_already_exists === true);
}
export async function listFolders(rootPath = rootPathEnv) {
    const response = await client.filesListFolder({
        path: rootPath,
        recursive: false,
    });
    const entries = response.result?.entries ?? [];
    return entries
        .filter((entry) => entry[".tag"] === "folder")
        .filter((entry) => typeof entry.path_lower === "string")
        .map((entry) => ({
        id: entry.id,
        name: entry.name,
        path_lower: entry.path_lower ?? entry.path_display ?? entry.id,
    }));
}
const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
export async function listImages(folderPath) {
    const response = await client.filesListFolder({
        path: folderPath,
        recursive: false,
    });
    const entries = response.result?.entries ?? [];
    return entries
        .filter((entry) => entry[".tag"] === "file")
        .filter((entry) => {
        const lower = entry.name.toLowerCase();
        return allowedExtensions.some((ext) => lower.endsWith(ext));
    })
        .filter((entry) => typeof entry.path_lower === "string")
        .map((entry) => ({
        id: entry.id,
        name: entry.name,
        path_lower: entry.path_lower ?? entry.path_display ?? entry.id,
        size: entry.size,
    }));
}
export async function ensureDirectLink(filePath) {
    const existingLink = await getExistingSharedLink(filePath);
    if (existingLink) {
        return existingLink;
    }
    try {
        const created = await client.sharingCreateSharedLinkWithSettings({
            path: filePath,
            settings: {
                requested_visibility: "public",
            },
        });
        const url = created.result.url;
        return toDirectUrl(url);
    }
    catch (error) {
        if (isLinkExistsError(error)) {
            const fallback = await getExistingSharedLink(filePath);
            if (fallback) {
                return fallback;
            }
        }
        throw error;
    }
}
//# sourceMappingURL=dropbox.js.map