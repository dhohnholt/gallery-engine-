// src/lib/supabaseClient.ts

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) {
  throw new Error("SUPABASE_URL is not set in environment variables");
}

const hasAnonKey = Boolean(anonKey);
const hasServiceRoleKey = Boolean(serviceRoleKey);

if (!hasAnonKey && !hasServiceRoleKey) {
  console.warn(
    "[gallery-engine] Neither SUPABASE_ANON_KEY nor SUPABASE_SERVICE_ROLE_KEY is set; Supabase clients will not work."
  );
}

if (!serviceRoleKey) {
  console.warn(
    "[gallery-engine] SUPABASE_SERVICE_ROLE_KEY is not set; admin client will not work."
  );
}

export const supabaseAnon: SupabaseClient = createClient(
  url,
  anonKey || "missing-anon-key"
);

export const supabaseAdmin: SupabaseClient = createClient(
  url,
  serviceRoleKey || "missing-service-role-key"
);
