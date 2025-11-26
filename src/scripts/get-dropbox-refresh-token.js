// src/scripts/get-dropbox-refresh-token.js
import express from "express";
import open from "open";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const app = express();

const PORT = 8989;
const REDIRECT_URI = process.env.DROPBOX_REDIRECT_URI;
const CLIENT_ID = process.env.DROPBOX_APP_KEY;
const CLIENT_SECRET = process.env.DROPBOX_APP_SECRET;

if (!REDIRECT_URI || !CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌ Missing environment variables.");
  process.exit(1);
}

// ------------------------------------------------------
// STEP 1 — Build URL for user authorization
// ------------------------------------------------------
const authUrl =
  "https://www.dropbox.com/oauth2/authorize" +
  `?client_id=${CLIENT_ID}` +
  `&token_access_type=offline` +
  `&response_type=code` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

console.log("🚀 Opening Dropbox OAuth screen...");
console.log("🔌 Listening on", REDIRECT_URI);

// Auto-open browser
open(authUrl);

// ------------------------------------------------------
// STEP 2 — Handle Dropbox redirect
// ------------------------------------------------------
app.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("Missing ?code");

  console.log("🔑 Received authorization code:", code);

  // Exchange code → refresh token
  const tokenRes = await fetch("https://api.dropbox.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  const json = await tokenRes.json();
  console.log("📦 Dropbox response:", json);

  if (!json.refresh_token) {
    res.send("❌ Failed to get refresh_token. Check console.");
    return;
  }

  console.log("\n🎉 SUCCESS! Your REFRESH TOKEN:\n");
  console.log(json.refresh_token);
  console.log("\n👉 Copy this into your .env:\n");
  console.log(`DROPBOX_REFRESH_TOKEN=${json.refresh_token}`);

  res.send("Refresh token generated! Check your terminal.");
});

// Start server
app.listen(PORT);
