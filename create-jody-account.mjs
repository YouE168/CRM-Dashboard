// create-jody-account.mjs
//
// Creates (or updates) a real Supabase Auth login for Jody at her real
// email, so she can log in through the app's normal /login page and see
// admin-only pages like Business Professional Services.
//
// Run locally from your project root:
//   node create-jody-account.mjs
//
// Reads credentials from .env.development.local — the service role key
// never leaves your machine, it's not sent anywhere else. Same pattern as
// create-admin.mjs, just for Jody's own login instead of the generic
// admin account.

import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// ---- Load env vars from .env.development.local manually ----
const envFile = fs.readFileSync(".env.development.local", "utf-8");
const env = {};
for (const line of envFile.split("\n")) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (match) env[match[1]] = match[2].trim();
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.development.local");
  process.exit(1);
}

// ---- EDIT THESE if you want different credentials ----
const JODY_EMAIL = "jody@hbcat.org";
const JODY_PASSWORD = "Jody123";
const JODY_NAME = "Jody Love";
// --------------------------------------------------------

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`Creating auth user for ${JODY_EMAIL}...`);

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: JODY_EMAIL,
    password: JODY_PASSWORD,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.includes("already been registered")) {
      console.log("Auth user already exists — updating password and looking it up instead...");
      const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) {
        console.error("Failed to list users:", listError.message);
        process.exit(1);
      }
      const existing = list.users.find((u) => u.email === JODY_EMAIL);
      if (!existing) {
        console.error("Could not find the existing user. Something's inconsistent.");
        process.exit(1);
      }
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password: JODY_PASSWORD,
      });
      if (updateError) {
        console.error("Failed to update password:", updateError.message);
        process.exit(1);
      }
      await upsertPublicUser(existing.id);
      return;
    }
    console.error("Failed to create auth user:", authError.message);
    process.exit(1);
  }

  console.log(`Auth user created: ${authData.user.id}`);
  await upsertPublicUser(authData.user.id);
}

async function upsertPublicUser(userId) {
  console.log("Creating/updating row in public.users...");

  const { error: dbError } = await supabaseAdmin
    .from("users")
    .upsert(
      {
        id: userId,
        email: JODY_EMAIL,
        name: JODY_NAME,
        primary_role: "admin",
        status: "active",
      },
      { onConflict: "id" },
    );

  if (dbError) {
    console.error("Failed to upsert public.users row:", dbError.message);
    process.exit(1);
  }

  console.log("\n✅ Done! Jody can now log in with:");
  console.log(`   Email:    ${JODY_EMAIL}`);
  console.log(`   Password: ${JODY_PASSWORD}`);
  console.log("\nHeads up: that's a pretty guessable password (her own name).");
  console.log("Worth having her change it from Profile > Change Password after she logs in.");
}

main();
