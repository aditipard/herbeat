# HerBeat

**Sync your cycle. Power your life.**

A hormonal health tracker: log your period, mood, symptoms and daily habits, see the
hormones behind how you feel, and ask a domain-locked assistant what any of it means.

Built with Next.js 14 (App Router), Supabase (Postgres + Auth + Row Level Security),
and the Anthropic API. Deploys to Vercel.

---

## What's in here

| Area | What it does |
|---|---|
| **Cycle dashboard** | Interactive hormone curve (estrogen, progesterone, LH, FSH) you can scrub day by day, plus a circular phase ring showing where you are today |
| **Daily check-in** | Mood, energy, flow, symptoms and a note — all taps, finishable in ~15 seconds |
| **Habit log** | Sleep, exercise, stress, water, caffeine, alcohol, logged beside your cycle |
| **Assistant** | Domain-locked chat that answers on cycle science and reads your own logged data |
| **Onboarding** | Five-step questionnaire building the lifestyle profile that personalises advice |
| **Reminders** | Opt-in daily browser notification at a time you choose |
| **Your data** | One-click JSON export and full account deletion |

---

## Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a project, then:

1. Open **SQL Editor** and paste the entire contents of `supabase/schema.sql`. Run it.
   This creates every table, index, trigger, and — critically — the Row Level Security
   policies.
2. Go to **Project Settings → API** and copy your Project URL, `anon` key, and
   `service_role` key.
3. Go to **Authentication → Providers → Email** and make sure email auth is enabled.
   Leave "Confirm email" on for production.

### 2. Get an Anthropic API key

Create one at [console.anthropic.com](https://console.anthropic.com). This powers the
assistant. The app runs fine without it — the assistant just returns a "not configured"
message.

### 3. Run it locally

```bash
npm install
cp .env.example .env.local   # then fill in your real keys
npm run dev
```

Open http://localhost:3000.

---

## Deploying to Vercel

1. Push this repo to GitHub (see below).
2. Go to [vercel.com/new](https://vercel.com/new), import the repository.
3. Add these environment variables in the Vercel project settings:

   | Variable | Where it comes from |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (**secret**) |
   | `ANTHROPIC_API_KEY` | console.anthropic.com (**secret**) |

4. Deploy. Then go back to Supabase → **Authentication → URL Configuration** and add
   your Vercel domain to the redirect allow-list, or email confirmation links will
   fail.

### Pushing to GitHub

```bash
git init
git add .
git commit -m "HerBeat: initial build"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/herbeat.git
git push -u origin main
```

`.gitignore` already excludes `.env`, `.env.local`, and `node_modules`. **Check that
no key ever appears in a commit** before pushing — once a secret is in git history it
must be rotated, not just deleted.

---

## Security

This app holds reproductive health data, which is among the most sensitive categories
there is. The measures below are built in.

**Access control**
- Row Level Security on every table, with owner-only policies for select, insert,
  update and delete. This is the actual enforcement layer — not a UI convention.
- The browser and server both use the `anon` key, so RLS applies to every query.
- `getUser()` (which revalidates the JWT against Supabase) is used for all
  authorization, never `getSession()`, which only reads an unverified cookie.
- The `service_role` key is used in exactly one place — `/api/account`, to delete the
  caller's own auth record — and only after their identity is verified from their own
  session.
- Middleware guards `/dashboard` and `/onboarding`; unauthenticated requests redirect.

**Transport and browser hardening** (`next.config.mjs`)
- HSTS with a two-year max-age and preload.
- `X-Frame-Options: DENY` plus `frame-ancestors 'none'` — this app can't be framed.
- `nosniff`, `strict-origin-when-cross-origin` referrer policy.
- Permissions-Policy disables camera, microphone, geolocation and FLoC.
- `X-Powered-By` removed.
- Session cookies are `httpOnly`, `secure` in production, `sameSite=lax`.

**Application layer**
- All API input validated with Zod, with length caps on every field.
- Rate limiting on the assistant (20 messages / 10 min / user) so a stolen session
  can't burn your API budget.
- Login errors are deliberately generic, so they can't be used to enumerate which
  emails have accounts.
- The auth callback only redirects to same-origin relative paths — no open redirect.
- Provider errors are logged server-side and never returned to the client.

**Privacy**
- Full JSON export of everything you've logged.
- Account deletion removes every row and the auth record itself.
- Sending your health data to the assistant is an explicit, per-message opt-in toggle.

### Before you have real users, do these

1. **Rate limiting** is in-memory, so it resets on redeploy and doesn't work across
   multiple instances. Move it to Upstash Redis or a Supabase table.
2. **Turn on Supabase leaked-password protection** (Auth → Policies) and consider MFA.
3. **Add a privacy policy.** If you have users in the EU or California, GDPR/CCPA apply
   to this data. Health data may also bring HIPAA into scope depending on how you
   operate — get legal advice before launch, not after.
4. **Set up Supabase database backups** and test restoring one.
5. **Consider column-level encryption** (pgsodium / Supabase Vault) for the check-in
   notes field, which is the most likely place for free-text sensitive detail.

---

## How the assistant is built

You can't practically train a women's-health-only LLM from scratch. What HerBeat does
instead gets the same result and is far more accurate:

1. **A hard-scoped system prompt** (`lib/assistant-prompt.ts`) that refuses anything
   outside hormonal and cycle health, and resists attempts to override it.
2. **A curated knowledge base** injected as context — cycle phases, hormone mechanisms,
   lifestyle guidance, conditions, and red-flag symptoms — so answers are grounded in
   vetted material rather than free recall.
3. **The user's own data**, optionally included, so it can reference their actual cycle
   day, logged moods, symptoms and habits.

Safety rules live server-side in the prompt, not in the UI, so a crafted client request
can't bypass them. The assistant never diagnoses, never recommends prescription
medication, surfaces red-flag symptoms early rather than burying them, and is explicit
that cycle tracking is not reliable contraception.

To extend its knowledge, edit `KNOWLEDGE_BASE` in `lib/assistant-prompt.ts`. If it grows
past a few thousand words, move to real retrieval: store documents in Supabase with
`pgvector`, embed the user's question, and inject only the top matches.

---

## The hormone model — an honest note

The curves are **population-average shapes scaled to your cycle length**, not
measurements of your hormones. They show what typically happens on a given cycle day.
The app says this to users in plain language rather than implying precision it
doesn't have.

The math lives in `lib/cycle.ts`: estrogen climbs through the follicular phase and peaks
just before ovulation with a secondary luteal rise; LH spikes narrowly at ovulation; FSH
rises early with a small ovulatory bump; progesterone stays near zero until ovulation,
then domes through the luteal phase and collapses before menstruation. Ovulation is
placed at `cycleLength − 14`, since the luteal phase is the stable part — so a 35-day
cycle correctly ovulates around day 21 rather than being squashed into a 28-day
template.

### Wiring up your wearable later

The architecture is already set up for it:

- `device_readings` exists in the schema (with RLS) for time-series sensor data.
- `buildHormoneSeries()` in `lib/cycle.ts` is the **single** function to swap. Have it
  read from `device_readings` instead of returning modelled values and keep the same
  return shape — `{ day, estrogen, progesterone, lh, fsh, phase }` — and every
  component downstream keeps working untouched.

---

## Project structure

```
app/
  (auth)/          login + signup
  api/
    assistant/     domain-locked chat endpoint (auth + rate limit + validation)
    account/       account deletion
  auth/callback/   email confirmation handler
  dashboard/       cycle view, check-in, habits, assistant, settings
  onboarding/      five-step questionnaire
components/        UI — PulseChart is the signature piece
lib/
  cycle.ts         hormone model + phase math (pure functions, fully tested)
  assistant-prompt.ts  system prompt, knowledge base, domain guardrails
  supabase/        browser + server clients, session middleware
supabase/schema.sql  tables, indexes, triggers, RLS policies
middleware.ts      route protection + session refresh
```

## Design

Palette is taken from the HerBeat logo — deep violet `#4E2A84`, mid purple `#7E57A8`,
lavender `#B9A3D3` — with berry for flow days and orchid for the ovulation peak, the two
places where data clarity beats brand consistency. All colors are CSS variables in
`app/globals.css`; changing the palette means editing that one block. Playfair Display
for headings echoes the wordmark; Inter carries all data and UI. Dark mode tokens are
defined and ready to wire to a toggle.
