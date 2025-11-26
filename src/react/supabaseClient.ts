// src/react/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

/**
 * Reads environment variables both in Node and in Vite/browser builds.
 * - In Node: reads from process.env (if available)
 * - In Browser (Vite): reads from import.meta.env (if available)
 */
function getEnv(key: string): string | undefined {
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key];
  }

  if (
    typeof globalThis !== "undefined" &&
    (globalThis as any).import?.meta?.env &&
    (globalThis as any).import.meta.env[key]
  ) {
    return (globalThis as any).import.meta.env[key];
  }

  // Vite's import.meta is available directly:
  if (typeof import.meta !== "undefined" && (import.meta as any).env?.[key]) {
    return (import.meta as any).env[key];
  }

  console.warn(`[GalleryEngine] Missing environment variable: ${key}`);
  return undefined;
}

const supabaseUrl = getEnv("VITE_SUPABASE_URL");
const supabaseAnonKey = getEnv("VITE_SUPABASE_ANON_KEY");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "[GalleryEngine] Missing Supabase env vars. Expected VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
