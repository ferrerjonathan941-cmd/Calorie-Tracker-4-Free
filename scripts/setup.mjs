#!/usr/bin/env node

import { createInterface } from "node:readline/promises";
import { existsSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "..", ".env.local");

// ── ANSI colors ──────────────────────────────────────────────────────────────
const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const cyan = (s) => `\x1b[36m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

// ── Helpers ──────────────────────────────────────────────────────────────────
function header(step, title) {
  console.log();
  console.log(bold(cyan(`── Step ${step}: ${title} ──`)));
}

async function prompt(rl, message, { required = false, validate } = {}) {
  while (true) {
    const answer = (await rl.question(`  ${message} `)).trim();

    if (!answer && !required) return "";

    if (!answer && required) {
      console.log(`  ${yellow("This field is required. Please try again.")}`);
      continue;
    }

    if (validate && !validate(answer)) continue;

    return answer;
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log();
  console.log(bold("  Calorie Tracker 4 Free — Local Setup"));
  console.log(dim("  This wizard creates your .env.local file.\n"));

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  try {
    // Check for existing .env.local
    if (existsSync(ENV_PATH)) {
      const overwrite = await rl.question(
        `  ${yellow(".env.local already exists.")} Overwrite? ${dim("(y/N)")} `
      );
      if (overwrite.trim().toLowerCase() !== "y") {
        console.log("\n  Aborted. Existing .env.local was not changed.\n");
        process.exit(0);
      }
    }

    // ── Step 1: Supabase URL ─────────────────────────────────────────────
    header(1, "Supabase URL");
    console.log(
      dim("  Go to supabase.com/dashboard -> your project -> Settings -> API")
    );
    const supabaseUrl = await prompt(
      rl,
      "Paste your Project URL (NEXT_PUBLIC_SUPABASE_URL):",
      {
        required: true,
        validate(v) {
          if (v.startsWith("https://")) return true;
          console.log(`  ${yellow("Must start with https://. Please try again.")}`);
          return false;
        },
      }
    );

    // ── Step 2: Supabase Anon Key ────────────────────────────────────────
    header(2, "Supabase Anon Key");
    console.log(dim("  From the same page, copy the anon / public key"));
    const supabaseAnonKey = await prompt(
      rl,
      "Paste your anon key (NEXT_PUBLIC_SUPABASE_ANON_KEY):",
      { required: true }
    );

    // ── Step 3: Database URL (optional) ──────────────────────────────────
    header(3, "Database URL (optional)");
    console.log(
      dim("  Go to Settings -> Database -> Connection string (URI)")
    );
    console.log(
      dim(
        "  This enables auto-setup of database tables. Without it you'll need to run SQL manually."
      )
    );
    const databaseUrl = await prompt(
      rl,
      "Paste your Database URL (or press Enter to skip):"
    );

    // ── Step 4: Gemini API Key ───────────────────────────────────────────
    header(4, "Gemini API Key");
    console.log(
      dim("  Go to aistudio.google.com/apikey -> Create API Key")
    );
    const geminiKey = await prompt(
      rl,
      "Paste your Gemini API Key (GEMINI_API_KEY):",
      { required: true }
    );

    // ── Step 5: USDA Key (optional) ──────────────────────────────────────
    header(5, "USDA API Key (optional)");
    console.log(
      dim("  Sign up at fdc.nal.usda.gov/api-key-signup (improves nutrition accuracy)")
    );
    const usdaKey = await prompt(
      rl,
      "Paste your USDA API Key (or press Enter to skip):"
    );

    // ── Step 6: Brave Key (optional) ─────────────────────────────────────
    header(6, "Brave API Key (optional)");
    console.log(
      dim("  Sign up at brave.com/search/api (helps with restaurant lookups)")
    );
    const braveKey = await prompt(
      rl,
      "Paste your Brave API Key (or press Enter to skip):"
    );

    // ── Write .env.local ─────────────────────────────────────────────────
    const lines = [
      "# Supabase (from supabase.com -> Project Settings -> API)",
      `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}`,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}`,
      "",
      "# Database (from supabase.com -> Project Settings -> Database -> Connection string -> URI)",
      "# Required for auto-setup; without it you must run supabase-setup.sql manually",
      `DATABASE_URL=${databaseUrl}`,
      "",
      "# Gemini AI (from aistudio.google.com -> Get API Key)",
      `GEMINI_API_KEY=${geminiKey}`,
      "",
      "# Optional: improves nutrition accuracy",
      `USDA_API_KEY=${usdaKey}`,
      `BRAVE_API_KEY=${braveKey}`,
      "",
      "# Optional: protects the /api/setup endpoint after initial deployment",
      "# Once set, POST /api/setup requires Authorization: Bearer <this-value>",
      "SETUP_SECRET=",
      "",
    ];

    writeFileSync(ENV_PATH, lines.join("\n"), "utf-8");

    // ── Summary ──────────────────────────────────────────────────────────
    console.log();
    console.log(green(bold("  Setup complete!")) + ` Run ${cyan("`npm run dev`")} to start.`);

    const skipped = [];
    if (!databaseUrl) skipped.push("DATABASE_URL");
    if (!usdaKey) skipped.push("USDA_API_KEY");
    if (!braveKey) skipped.push("BRAVE_API_KEY");

    if (skipped.length) {
      console.log(
        yellow(`\n  Note: You skipped optional keys: ${skipped.join(", ")}`)
      );
      console.log(
        dim("  You can add them to .env.local later if needed.")
      );
    }

    console.log();
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error("\n  Setup failed:", err.message);
  process.exit(1);
});
