# Troubleshooting

## Setup Issues

### "Supabase is not configured" on first visit

Your Supabase environment variables are missing. Make sure these are set:

- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL (e.g. `https://abcdefg.supabase.co`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your Supabase anon/public key

If you deployed on Vercel, go to your project **Settings > Environment Variables** and add them.

### Auto-setup says "DATABASE_URL is not set"

The auto-migration needs a direct Postgres connection string. You have two options:

1. **Add `DATABASE_URL`**: Go to Supabase Dashboard > Settings > Database > Connection string (URI). Copy it and add it to your environment variables.
2. **Manual setup**: Copy `supabase-setup.sql` and run it in the Supabase SQL Editor.

### "Failed to connect to database" during auto-setup

- Verify `DATABASE_URL` is correct and includes your actual password (replace `[YOUR-PASSWORD]`)
- Make sure you're using the **pooler** connection string (port 6543), not the direct one (port 5432) — Vercel serverless functions require the pooler
- Check that your Supabase project is active and not paused

## Authentication Issues

### "Invalid login credentials"

- Make sure you've enabled at least one auth provider in Supabase Dashboard > Authentication > Providers
- For email login, check that email confirmations are configured (or disabled for testing)

### Redirect after login goes to wrong URL

Add your app URL to Supabase Dashboard > Authentication > URL Configuration > Redirect URLs:
- `https://your-app.vercel.app/auth/callback`
- `http://localhost:3000/auth/callback` (for local development)

## Food Scanning Issues

### "Food scanning is not configured"

Your `GEMINI_API_KEY` environment variable is missing. Get a free key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

### "You've run out of free credits"

The free Gemini API tier has rate limits. Options:
- Wait a minute and try again (rate limits reset quickly)
- Upgrade to a paid Gemini API plan at [aistudio.google.com](https://aistudio.google.com)
- Use text descriptions instead of photos (uses fewer API credits)

### Nutrition numbers seem inaccurate

Add these optional API keys for better accuracy:
- `USDA_API_KEY` — cross-references the USDA FoodData Central database
- `BRAVE_API_KEY` — searches for restaurant-specific nutrition data

## PWA / Mobile Issues

### App doesn't install on phone

- **iOS**: Use Safari (Chrome on iOS doesn't support PWA install)
- **Android**: Use Chrome and look for the install banner
- Make sure you're accessing the app via HTTPS (not HTTP)

### Photos don't upload

- Check that the `food-photos` storage bucket exists in your Supabase project
- If you ran manual setup, make sure the storage policies were created (bottom of `supabase-setup.sql`)

## Local Development Issues

### `npm run dev` crashes on startup

- Make sure all required env vars are in `.env.local` (copy from `.env.example`)
- Run `npm install` to ensure all dependencies are installed
- Verify Node.js version is 18 or higher: `node --version`

### TypeScript errors after pulling updates

```bash
rm -rf .next node_modules
npm install
npm run dev
```

## Still Stuck?

Open an issue on GitHub with:
1. What you were trying to do
2. The error message (screenshot or text)
3. Your deployment method (Vercel, local, etc.)
