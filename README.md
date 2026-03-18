# Calorie Tracker 4 Free

A free, AI-powered calorie tracker you can deploy in minutes. Snap a photo of your meal, and Gemini AI identifies every item with calories and macros. Install it as a PWA on your phone for a native app experience.

<!-- TODO: Add demo screenshot -->
<!-- ![Demo](docs/demo.png) -->

## Features

- **AI Food Scanning** - Take a photo or describe your meal; Gemini 2.5 Flash identifies items and estimates nutrition
- **USDA-Verified Data** - Cross-references USDA FoodData Central for accurate calorie and macro counts
- **Chain Restaurant Support** - Recognizes menus from popular chains (McDonald's, Chipotle, etc.) with official nutrition data
- **Draft & Edit** - Review AI results before saving; adjust portions, add missed items, or remove extras
- **Saved Meals** - Save frequent meals for one-tap logging
- **Daily Dashboard** - Visual breakdown of calories, protein, carbs, and fat with meal-by-meal history
- **PWA** - Installable on iOS, Android, and desktop; works offline for viewing past entries
- **Auto-Setup** - Database tables are created automatically on first deploy (or paste one SQL file)
- **100% Free** - All services used have generous free tiers

## Get Your Own (Free)

Before you start, create free accounts on these two services (if you don't have them already):

1. **[GitHub](https://github.com/signup)** — needed to copy the project to your account
2. **[Vercel](https://vercel.com/signup)** — hosts your app for free. **Connect your GitHub account** when signing up.

### 1. Get a Gemini API Key (~1 minute)

Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey), create a key, and copy it. That's the only key you need to paste manually.

### 2. Deploy to Vercel (~2 minutes)

Click the button below. Vercel will auto-create a Supabase project for you (database + auth, no signup required).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fferrerjonathan941-cmd%2Fcalorie-tracker&env=GEMINI_API_KEY&envDescription=Gemini%20AI%20key%20from%20aistudio.google.com%2Fapikey&envLink=https%3A%2F%2Fgithub.com%2Fferrerjonathan941-cmd%2Fcalorie-tracker%2Fblob%2Fmain%2Fdocs%2FSETUP.md&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22supabase%22%2C%22productSlug%22%3A%22supabase%22%7D%5D)

The Supabase integration sets your database URL and API keys automatically. The app creates all tables on first visit.

> **Not using Vercel?** See [docs/SETUP.md](docs/SETUP.md) for manual setup with any host.

### 3. Install on Your Phone

Open your deployed URL in Safari (iOS) or Chrome (Android) and tap "Add to Home Screen" for a native app experience.

### Optional: Improve Accuracy

| Service | Env Var | What It Does | Cost |
|---------|---------|-------------|------|
| USDA FoodData Central | `USDA_API_KEY` | Cross-references USDA nutrition data | Free |
| Brave Search | `BRAVE_API_KEY` | Looks up restaurant menu nutrition | Free (2k queries/mo) |

Add these in the app under **Settings > API Keys** after you log in — no environment variables needed. (You can also set them as env vars if you prefer.)

---

## Manual Database Setup

If auto-setup doesn't work (e.g. you didn't add `DATABASE_URL`):

1. Open your Supabase project's **SQL Editor**
2. Copy the contents of [`supabase-setup.sql`](supabase-setup.sql)
3. Paste and run
4. Reload the app

See [docs/SETUP.md](docs/SETUP.md) for a detailed walkthrough.

## Troubleshooting

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for common issues.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, React 19)
- **Database**: [Supabase](https://supabase.com/) (Postgres + Auth + Storage)
- **AI**: [Gemini 2.5 Flash](https://ai.google.dev/) via Google AI SDK
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Deployment**: [Vercel](https://vercel.com/)

## Local Development

```bash
git clone https://github.com/ferrerjonathan941-cmd/Calorie-Tracker-4-Free.git
cd Calorie-Tracker-4-Free
npm install
npm run setup   # interactive wizard that creates .env.local
npm run dev
```

## Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

## License

[MIT](LICENSE)
