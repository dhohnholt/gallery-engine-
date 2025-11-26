// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";
const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url) {
    throw new Error("SUPABASE_URL is not set in environment variables");
}
if (!anonKey) {
    console.warn("[gallery-engine] SUPABASE_ANON_KEY is not set; anon client may not work.");
}
if (!serviceRoleKey) {
    console.warn("[gallery-engine] SUPABASE_SERVICE_ROLE_KEY is not set; admin client will not work.");
}
export const supabaseAnon = createClient(url, anonKey || "missing-anon-key");
export const supabaseAdmin = createClient(url, serviceRoleKey || "missing-service-role-key");
//# sourceMappingURL=supabaseClient.js.map