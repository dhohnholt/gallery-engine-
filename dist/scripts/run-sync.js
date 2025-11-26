// scripts/run-sync.ts
import "dotenv/config";
const getSyncModule = async () => (await import(new URL("../src/sync/syncFromDropbox.js", import.meta.url).href));
(async () => {
    console.log("🔄 Running Dropbox → Supabase sync...");
    try {
        const { syncFromDropbox } = await getSyncModule();
        await syncFromDropbox();
        console.log("✅ Sync completed successfully.");
    }
    catch (err) {
        console.error("❌ Sync failed:", err);
        process.exit(1);
    }
})();
//# sourceMappingURL=run-sync.js.map