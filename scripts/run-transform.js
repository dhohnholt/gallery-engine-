// scripts/run-transform.js

import { execSync } from "child_process";

// Pull env vars from .env
import dotenv from "dotenv";
dotenv.config();

// --------------------------------------------
// Required env vars
// --------------------------------------------
const PROJECT_URL = process.env.SUPABASE_URL;
const FUNCTION_NAME = "generate-thumbnails"; // <- your function name
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!PROJECT_URL || !SERVICE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SERVICE_KEY in environment.");
  process.exit(1);
}

const endpoint = `${PROJECT_URL}/functions/v1/${FUNCTION_NAME}`;

console.log("🚀 Triggering Supabase edge function…");
console.log(`   → ${endpoint}`);

try {
  const output = execSync(
    `curl -s -X POST '${endpoint}' \
      -H 'Authorization: Bearer ${SERVICE_KEY}' \
      -H 'Content-Type: application/json' \
      -d '{}'`,
    { stdio: "inherit" }
  );

  console.log("\n🎉 Transform function completed.");
} catch (err) {
  console.error("❌ Transform function error:", err.message);
  process.exit(1);
}
