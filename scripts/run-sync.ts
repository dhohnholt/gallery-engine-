// scripts/run-sync.ts

import "dotenv/config";

type SyncModule = typeof import("../src/sync/syncFromDropbox");

const getSyncModule = async () =>
  (await import(
    new URL("../src/sync/syncFromDropbox.js", import.meta.url).href
  )) as SyncModule;

(async () => {
  console.log("🔄 Running Dropbox → Supabase sync...");

  try {
    const { syncFromDropbox } = await getSyncModule();
    await syncFromDropbox();
    console.log("✅ Sync completed successfully.");
  } catch (err) {
    console.error("❌ Sync failed:", err);
    process.exit(1);
  }
})();
