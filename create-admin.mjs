// create-admin.mjs
//
// Creates a real Supabase Auth user AND a matching row in public.users,
// so they can log in through the app's normal /login page.
//
// Run locally from your project root:
//   node create-admin.mjs
//
// Reads credentials from .env.development.local — the service role key
// never leaves your machine, it's not sent anywhere else.

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

// ---- EDIT THESE if you want a different admin email/password ----
const ADMIN_EMAIL = "admin@ruralcommunity.org";
const ADMIN_PASSWORD = "admin123";
const ADMIN_NAME = "Admin User";
// -------------------------------------------------------------

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`Creating auth user for ${ADMIN_EMAIL}...`);

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.includes("already been registered")) {
      console.log("Auth user already exists — looking it up instead...");
      const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) {
        console.error("Failed to list users:", listError.message);
        process.exit(1);
      }
      const existing = list.users.find((u) => u.email === ADMIN_EMAIL);
      if (!existing) {
        console.error("Could not find the existing user. Something's inconsistent.");
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
        email: ADMIN_EMAIL,
        name: ADMIN_NAME,
        primary_role: "admin",
        status: "active",
      },
      { onConflict: "id" },
    );

  if (dbError) {
    console.error("Failed to upsert public.users row:", dbError.message);
    process.exit(1);
  }

  console.log("\n✅ Done! You can now log in with:");
  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
}

main();
