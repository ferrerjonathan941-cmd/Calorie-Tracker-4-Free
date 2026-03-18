# Detailed Setup Guide

This guide walks through setting up Calorie Tracker 4 Free step by step.

## Prerequisites

- A free [Supabase](https://supabase.com) account
- A free [Google AI Studio](https://aistudio.google.com) account
- A free [Vercel](https://vercel.com) account (for deployment) or Node.js 18+ (for local dev)

## Step 1: Create a Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Pick a name and set a database password (save this password!)
4. Choose a region close to your users
5. Wait for the project to finish provisioning (~2 minutes)

## Step 2: Get Your Supabase Keys

1. In your project, go to **Settings > API**
2. Copy:
   - **Project URL** → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Go to **Settings > Database**
4. Under **Connection string**, switch to **URI** mode
5. Copy the URI and replace `[YOUR-PASSWORD]` with the password from Step 1 → this is your `DATABASE_URL`

## Step 3: Get a Gemini API Key

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Click **Create API Key**
3. Copy it → this is your `GEMINI_API_KEY`

## Step 4: (Optional) Get USDA and Brave Keys

These improve nutrition accuracy but are not required:

- **USDA**: [fdc.nal.usda.gov/api-key-signup](https://fdc.nal.usda.gov/api-key-signup) — sign up and get your key via email
- **Brave Search**: [brave.com/search/api](https://brave.com/search/api/) — sign up for the free tier

> **Tip:** You can paste these keys directly into the app's **Settings > API Keys** page after your first login — no environment variables needed.

## Step 5: Deploy

### Option A: Deploy to Vercel (Recommended)

1. Click the **Deploy with Vercel** button in the README
2. Connect your GitHub account if prompted
3. Paste your environment variables when asked
4. Click **Deploy**
5. Wait for the build to finish (~2 minutes)
6. Visit your URL — the database tables are created automatically
7. **Important:** Add your redirect URL (see Step 5b below) or login won't work

### Option B: Run Locally

```bash
git clone https://github.com/ferrerjonathan941-cmd/Calorie-Tracker-4-Free.git
cd Calorie-Tracker-4-Free
npm install
npm run setup   # interactive wizard that creates .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Step 5b: Configure Authentication (Required)

> **Don't skip this** — login will silently fail without redirect URLs configured.

1. In your Supabase dashboard, go to **Authentication > Providers**
2. Enable at least one sign-in method:
   - **Email** (simplest — enable and you're done)
   - **Google** (requires a Google Cloud OAuth client ID)
   - **GitHub** (requires a GitHub OAuth app)
3. Under **Authentication > URL Configuration**, add your deployment URL to **Redirect URLs**:
   - `https://your-app.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` (for local dev)

## Step 7: Install as PWA

- **iOS**: Open in Safari → tap Share → "Add to Home Screen"
- **Android**: Open in Chrome → tap the install banner or Menu → "Add to Home Screen"
- **Desktop**: Click the install icon in the browser address bar

## Database Setup (If Auto-Setup Fails)

If you see the setup screen saying auto-setup needs `DATABASE_URL`:

1. Open your Supabase project's **SQL Editor**
2. Copy the entire contents of `supabase-setup.sql` from the repository root
3. Paste it into the SQL Editor
4. Click **Run**
5. Reload the app

All tables, indexes, RLS policies, and storage buckets will be created.
