// src/lib/dropboxAuth.ts
import fetch from "node-fetch";

const DROPBOX_APP_KEY = process.env.DROPBOX_APP_KEY!;
const DROPBOX_APP_SECRET = process.env.DROPBOX_APP_SECRET!;
const REFRESH_TOKEN = process.env.DROPBOX_REFRESH_TOKEN;

// Pre-encoded "Basic <BASE64(client_id:secret)>"
const BASIC_AUTH = Buffer.from(
  `${DROPBOX_APP_KEY}:${DROPBOX_APP_SECRET}`
).toString("base64");

/**
 * Exchanges refresh_token → access_token
 */
export async function getDropboxAccessToken(): Promise<string> {
  if (!REFRESH_TOKEN) {
    throw new Error(
      "Missing DROPBOX_REFRESH_TOKEN in .env. Run the refresh-token generator first."
    );
  }

  const res = await fetch("https://api.dropbox.com/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${BASIC_AUTH}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: REFRESH_TOKEN,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to refresh Dropbox token: ${res.status} - ${text}`);
  }

  const json = (await res.json()) as { access_token?: string };

  if (!json.access_token) {
    throw new Error(
      "Dropbox token refresh returned no access_token. Check scopes + redirect URI."
    );
  }

  return json.access_token;
}
