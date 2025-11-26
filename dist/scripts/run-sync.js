// src/scripts/run-sync.ts
// Auto-load .env before anything else
import dotenv from "dotenv";
import path from "path";
// Load .env from project root
dotenv.config({
    path: path.resolve(process.cwd(), ".env"),
});
const getSyncModule = async () => {
    const modulePath = new URL("../sync/syncFromDropbox.js", import.meta.url)
        .href;
    return (await import(modulePath));
};
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