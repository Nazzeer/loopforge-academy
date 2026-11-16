# Loopforge Academy — Decisions

Taken by Muse on 2026-11-16 under Nazeer's instruction: "research like big 4 consulting and take decision accordingly and build."
Evidence base: research-report.md (same folder). Every decision below can be revisited by Nazeer; defaults are set so the build proceeds.

## 1. Positioning — an outcome engine, not a course library
The content of agent-building is free (LangChain Academy, Hugging Face, DeepLearning.AI). Nobody can sell videos against $0. What none of the 8 competitors scanned sells to SMEs is: an AI coach that makes a small team ship a working, checked, gated agent system inside their own product, with progress proven by evidence-based done-tests.
- Product promise: "Your team ships a real agent system — and can prove it."
- The moat is the coach + done-test evidence + drills on the customer's own projects. Content is the commodity input, never the pitch.

## 2. Wedge — logistics & operations SMEs first
- First vertical: logistics/ops SMEs, because Nazeer already has a live SaaS (Carrier Packet Agent) and credibility there; his own customers are the first channel.
- One curriculum at launch: Loops & Graphs (6 modules + capstone), drilled on the learner's own product.
- Adjacent verticals only after the wedge proves out.

## 3. Pricing — per-org subscription, three tiers
Research ladder adopted (supersedes the $19/$49/$119 placeholder in the original build spec):
- **Starter $79/mo — 5 seats**
- **Pro $199/mo — 15 seats** (≈$13/seat/mo, under half the $360–399/seat/yr incumbent anchor)
- **Premium $449/mo — 40 seats**
Rationale: this sells against L&D budgets and $900+ per-person cohorts, not against Carrier's $14.99 operational pricing; the AI coach carries real inference cost per seat.
Standing principles carried over from Carrier: all features in every plan (never cripple the core job), limits = seats only, soft limits at launch (warn, don't block), 14-day free trial, card-free until Stripe is connected, annual billing (2 months free) deferred until after launch.

## 4. Architecture — the operator's proven stack
- Cloudflare Worker + D1, vanilla JS SPA, no build step, no framework dependencies.
- Multi-tenant organisations: every query scoped by org_id; seats enforced per plan (soft).
- All durable config pinned in wrangler.toml [vars] (GitHub-triggered deploys wipe dashboard-set vars — learned on Carrier).
- AI coach via Workers AI (@cf/qwen/qwen3-30b-a3b-fp8, free tier) at launch; paid model path is a later, separate decision.
- Stripe scaffolding inert (503 BILLING_NOT_CONFIGURED) until Nazeer connects his Stripe account — same pattern as Carrier and Ledgerly.
- GitHub repo + Cloudflare deploy are owner-guided steps (dashboard logins happen in Nazeer's own browser).

## 5. Security model
- Passwords: PBKDF2 hashes only. Session tokens stored hashed.
- Org isolation enforced server-side on every query; no cross-org reads.
- Security headers on all responses: CSP, HSTS, X-Content-Type-Options, Referrer-Policy (the gap found in the ComplianceOS audit does not repeat here).
- Audit log for signup, login, and done-test reviews.
- No secrets in D1; coach rate-limited (30 msgs/hr per user); evidence submissions are text-only in the MVP.

## 6. Validation gate (kill / pivot rule, set in advance)
By day 90 after launch: **≥10 paying organisations AND ≥40% capstone completion.**
- Miss on orgs → distribution problem: pivot to a live cohort model (Maven-style pricing proves willingness to pay).
- Miss on completion → product problem: fix the coach/drills before spending on growth.
This gate is the Module-2 discipline applied to the business itself: a stop condition written before the loop starts.

## 7. Name
"Loopforge Academy" is the working name. Rename before public launch if Nazeer prefers; nothing in the build depends on it.
