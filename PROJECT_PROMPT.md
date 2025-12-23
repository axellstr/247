# Daily Stoic — Email Service

A complete system that sends daily stoic quotes to subscribers.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      LANDING PAGE (Astro + Vercel)                      │
│                                                                         │
│  [Enter email] [Subscribe]  ──►  /api/subscribe  ──►  Supabase DB      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      TRIGGER.DEV (8:00 AM UTC daily)                    │
│                                                                         │
│  1. Query active subscribers from Supabase                              │
│  2. Pick today's quote (deterministic by day of year)                   │
│  3. Send email to each subscriber via Resend                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Landing Page | Astro (SSR) |
| Styling | Plain CSS |
| Database | Supabase (PostgreSQL) |
| Emails | Resend API |
| Background Jobs | Trigger.dev |
| Hosting | Vercel |

## Environment Variables

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...    # For Trigger.dev (server-side)

# Resend
RESEND_API_KEY=re_xxx
EMAIL_FROM=Daily Stoic <noreply@yourdomain.com>

# App
APP_URL=https://your-app.vercel.app
```

## Setup

### 1. Supabase Database

Run the SQL in `supabase/schema.sql` to create the `subscribers` table.

### 2. Local Development

```bash
# Install dependencies
npm install

# Run Astro dev server
npm run dev

# Run Trigger.dev dev (separate terminal)
npm run dev:trigger
```

### 3. Deploy

```bash
# Deploy to Vercel (auto-detects Astro)
vercel

# Deploy Trigger.dev tasks
npm run deploy:trigger
```

## File Structure

```
src/
├── pages/
│   ├── index.astro          # Landing page
│   ├── unsubscribe.astro    # Unsubscribe page
│   └── api/
│       ├── subscribe.ts     # Subscribe endpoint
│       └── unsubscribe.ts   # Unsubscribe endpoint
├── styles/
│   └── global.css           # All styles
├── lib/
│   └── supabase.ts          # Supabase client
└── trigger/
    └── daily-stoic-quote.ts # Trigger.dev tasks
```

## Features

- ✅ Beautiful dark-themed landing page
- ✅ Email subscription with validation
- ✅ One-click unsubscribe
- ✅ 30 curated stoic quotes
- ✅ Professional HTML emails
- ✅ Automatic retries on failure
- ✅ Full observability via Trigger.dev dashboard
