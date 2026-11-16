# Loopforge Academy

An AI/ML **agentic learning platform for SMEs and startups**. Organisations buy seats;
their staff learn to build AI agent systems — checked loops inside gated graphs — through
**6 modules + a capstone**, coached by a built-in AI coach, with progress gated by
**evidence-based done-tests** reviewed by the organisation's admin.

Built on the operator's standard stack: a single Cloudflare Worker, D1 database,
Workers AI, and a vanilla-JS SPA. No build step, no frameworks. All durable config is
pinned in `wrangler.toml` `[vars]` (deploys wipe dashboard-set vars, so nothing
important lives there).

## Pricing

| Plan | Price | Seats |
|---|---|---|
| Starter | $79/mo | 5 |
| Pro | $199/mo | 15 |
| Premium | $449/mo | 40 |

14-day free trial on every plan. **All features in every plan — plans differ only by
seats.** Seat limits are **soft** (`LIMITS_MODE = "soft"`): inviting past the cap warns
and lets the invite finish; it never blocks.

## Layout

- `wrangler.toml` — Worker config: D1 binding `DB`, Workers AI binding `AI`, `[vars]`.
- `db/migrations/0001_init.sql` — schema record (organisations, users, sessions,
  subscriptions, modules, lessons, progress, coach_messages, audit_log) + module seed.
- `src/index.js` — the Worker: API + SPA host, security headers on every response.
- `src/plans.js` — plan ladder, seat checks, subscription gate (pure, unit-tested).
- `src/auth.js` — PBKDF2 password hashing + hashed session tokens (pure WebCrypto).
- `src/schema.js` — runtime copy of the migration, executed by the setup endpoint.
- `src/lessons.js` — lesson content (full text for Module 1, concise for the rest).
- `src/coach.js` — the AI coach's system prompt (from the Loops & Graphs Coach rules)
  and the fallback message used when the AI binding is unavailable.
- `public/` — the SPA: landing + pricing, signup/login, dashboard, module view with
  evidence submission, admin review queue, team management, billing page, coach drawer.
- `tests/run.mjs` — unit tests for plans, gating, and password hashing.

## Key behaviours

- **Setup:** `POST /api/setup` with the `SETUP_KEY` runs all migrations idempotently
  and seeds modules/lessons. It never deletes data.
- **Auth:** PBKDF2 (100k iterations, per-user salt). Session tokens are random;
  only their SHA-256 hash is stored. `org_id` is enforced on **every** query —
  no cross-organisation reads, including the review endpoints.
- **Subscription gate:** an expired/canceled subscription gets `402` on app APIs,
  but login, `/api/me`, billing, and setup always stay reachable.
- **Done-test gate:** a learner submits `evidence_text` for a module (status →
  `submitted`); an org admin approves (→ `done`) or returns it with a note
  (→ `returned`). Signup, login, and progress reviews are written to `audit_log`.
- **Coach:** `POST /api/coach` chats with Workers AI (`ASSISTANT_MODEL`, pinned in
  `wrangler.toml`) using the coach rules as its system prompt, with the learner's
  module progress as context. Rate limit: 30 messages/hour per user. If the AI
  binding is unavailable, the endpoint returns a clear fallback message — never a crash.
- **Billing:** `GET /api/billing` returns plan/status/seats. Checkout and portal
  endpoints return `503 BILLING_NOT_CONFIGURED` until Stripe keys exist in the
  environment — no real Stripe calls happen in this MVP.

## Local development

```sh
npm install          # installs wrangler (devDependency) only
npx wrangler dev     # local Worker + local D1
```

Then run setup once (creates tables + seed content in the local D1):

```sh
curl -X POST localhost:8787/api/setup \
  -H 'Content-Type: application/json' \
  -d '{"setup_key":"dev-setup-key-change-me"}'
```

Open `localhost:8787`, sign up an organisation (starts a 14-day trial), and learn.
Note: Workers AI may not respond under plain local dev — the coach will return its
fallback message there by design.

## Tests

```sh
node tests/run.mjs   # or: npm test
node --check src/index.js src/plans.js src/auth.js src/schema.js src/lessons.js src/coach.js public/app.js
```

## Owner actions still needed (not done by this MVP)

1. **Create the GitHub repo** and push this code (GitHub pushes are approval-gated —
   the operator taps Approve; pushes must come from a clean, committed tree, and
   `node --check` must pass on every `.js` file first).
2. **Create the D1 database + deploy via Cloudflare** (guided, in the operator's own
   browser): create `loopforge-db`, put its real `database_id` in `wrangler.toml`
   (replacing the placeholder), set a production `SETUP_KEY`, deploy the Worker,
   then call `POST /api/setup` once against production.
3. Later: connect Stripe (add `STRIPE_SECRET_KEY` etc. as Worker secrets) to turn
   the billing scaffolding into live checkout.
