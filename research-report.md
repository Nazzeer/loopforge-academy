# LoopForge Academy — Market Research & Build Decision Report

**Product concept:** An AI/ML agentic learning platform for SMEs and startups. Organisations open an account, buy seats, and staff learn to *build* AI agent systems — the "loops & graphs" method (checked agent loops inside gated graphs; Claude Code `/goal` and `/loop`, DSPy, LangGraph, Pydantic Graph, CrewAI Flows, Apache Burr) — coached by a built-in AI agent, with hands-on drills on the learner's own projects and progress gated by evidence-based "done-tests" rather than video-watching. Stack: Cloudflare Workers + D1. Model: subscriptions, basic → premium.

**Prepared:** 2026-11-16 · **Style:** strategy-consulting decision report · **Status:** Final recommendation in §7

---

## 1. Executive summary

**The opportunity is real but narrow.** Demand-side evidence is strong: AI-in-corporate-training spend is growing at ~15.5% CAGR, employer AI skills gaps are the #1 cited blocker to AI value, and agentic AI is moving from pilots to production faster than the workforce can follow. Supply-side evidence is the warning: the *content* of agent-building is already free from the framework owners themselves (LangChain Academy, Hugging Face, DeepLearning.AI), and generalist catalogues (Coursera, Udemy, LinkedIn) own SME learning budgets at ~$360–399 per seat per year.

**The only defensible product is not a course library. It is an outcome engine:** an AI coach that makes a small team ship a working, checked, gated agent system *inside their own product*, and proves it with evidence. That is the one thing none of the eight competitors scanned in §3 sells to SMEs today.

**Recommendation: BUILD — but only as a wedge product, not a platform bet.** Launch with one vertical (logistics/operations SMEs, where the operator already has a live SaaS and credibility), one curriculum (Loops & Graphs, 6 modules + capstone), three tiers at **$79 / $199 / $449 per month**, and a hard validation gate: 10 paying organisations and ≥40% capstone completion within 90 days of launch, or pivot/kill. Detail in §7.

Key numbers behind the verdict:

| Signal | Figure | Source |
|---|---|---|
| AI in corporate training market | $3.88B (2025) → $8.01B (2030), 15.5% CAGR | The Business Research Company |
| Employers citing skills gaps as barrier to transformation | 63% | WEF Future of Jobs 2025 |
| Employees receiving *sufficient* AI training | Only 12% | EY Work Reimagined 2025 |
| Enterprises running production agents by 2030 (from 5% in 2025) | 55% | Gartner forecast |
| Self-paced online course completion | ~3–13% median | Jordan (2015); Reich & Ruipérez-Valiente, *Science* (2019) |
| Team learning catalogue price anchor | $360–399 / seat / year | Udemy Business, LinkedIn Learning, Coursera for Teams |
| Live cohort willingness-to-pay for agent skills | $900–$4,500 / person | Maven agent/evals cohorts |

---

## 2. Market analysis

### 2.1 Market size and growth

- **AI in corporate training** (the direct category) was sized at **$3.88B in 2025, growing to $4.5B in 2026 (15.9%) and $8.01B by 2030 at a 15.5% CAGR**, driven by personalised learning systems, learning analytics, and continuous upskilling demand. North America is the largest region; Asia-Pacific the fastest-growing. (The Business Research Company, *AI in Corporate Training Global Market Report 2026* — https://www.thebusinessresearchcompany.com/report/artificial-intelligence-ai-in-corporate-training-market-report)
- **Broader AI-in-education** estimates run higher — $6–8.3B in 2025 growing to $15–32B by 2030 at 20–31% CAGR — reflecting how definitional the category is; we use the narrower corporate-training figure for planning. (Summary of estimates: https://www.ainvest.com/news/upskilling-investment-targeting-education-platforms-ai-adjacent-training-providers-reskilling-boom-2512/)
- **The demand shock underneath:** Gartner forecasts agentic AI software spend rising from **$86B in 2025 to $985B by 2030 (62.7% CAGR)**, with **55% of enterprises running production agents across multiple functions by 2030, up from 5% in 2025**, and 40% of enterprise apps featuring task-specific agents by end-2026. Every one of those deployments needs people who can build *checked, gated* agent systems — precisely the skill this product teaches. (Gartner, *Forecast Analysis: Agentic AI Spending in Software Markets*, Feb 2026 — https://emt.gartnerweb.com/ngw/globalassets/en/insights/documents/forecast-analysis-agentic-ai-spending-in-software-markets.pdf)
- **Counterweight:** Gartner also predicts **40%+ of agentic AI projects will be cancelled by end-2027** for cost, unclear value, or inadequate risk controls — which is an argument *for* teaching checks/gates/evals (the failure modes are the curriculum), and a churn risk if customer projects die. (https://report-ai.org/indexes/enterprise-ai/agentic-ai-statistics-2026/)

### 2.2 SME appetite — wide, not deep

- US small-business generative-AI use jumped **23% (2023) → 40% (2024) → 58% (2025)** (US Chamber of Commerce). Official-statistics measures are lower but moving the same way: Eurostat puts 2025 AI use at **17% of small EU firms vs 55% of large firms**; OECD firm-level adoption more than doubled, 8.7% (2023) → 20.2% (2025). The consistent pattern: **adoption is broad but shallow, and small firms lag large firms by ~35 points** — the gap is skills and implementation depth, not awareness. (Compiled official sources: https://www.omago.ai/blog/sme-ai-adoption-2026-data ; Eurostat analysis: https://mellekis.com/research/state-of-ai-adoption-smes-ireland-uk-eu-2026)
- Depth data confirms the opening: in Ireland, only **4.3% of small enterprises use AI for workflow automation or decision-making** even as headline use hit 17.2% — i.e., SMEs use chatbots, not agent systems. (CSO data via https://mellekis.com/research/state-of-ai-adoption-smes-ireland-uk-eu-2026)
- **The training deficit is quantified:** EY's 2025 Work Reimagined survey (15,000 employees, 1,500 employers, 29 countries) found 88% of employees use AI at work but mostly for search/summarisation, only **5% use it in advanced, work-transforming ways, and only 12% receive sufficient AI training**; organisations with strong talent foundations unlock up to 40% more productivity gains. (https://www.ey.com/en_th/newsroom/2025/12/ey-survey-reveals-companies-are-missing-out-on-up-to-40-percent-of-ai-productivity-gains-due-to-gaps-in-talent-strategy)
- **Employers know it:** 63% of employers in the WEF Future of Jobs Report 2025 cite skills gaps as a major barrier to business transformation, AI/big data are the fastest-growing skills, and **77% plan to reskill/upskill existing staff** rather than hire. Emergn's 2025 study found **52% of organisations cannot hire the data & AI skills they need** — for SMEs, who lose bidding wars for AI engineers, *building* the skill internally is the only route. (https://medium.com/@sellcraft.marketing/ai-talent-gap-a-talent-solution-beyond-hiring-cf4050865eb1 ; https://itbrief.news/story/organisations-face-widening-skills-gap-for-ai-roles)

### 2.3 TAM / SAM / SOM (bottom-up, assumptions stated)

Top-down TAM is not decision-useful here; we model bottom-up. **All counts below are planning assumptions, not sourced statistics** — the sourced anchors are the adoption rates above and the price points in §5.

| Layer | Definition | Assumption | Value |
|---|---|---|---|
| TAM | Global corporate AI-training spend | Sourced (§2.1) | $3.88B (2025) → $8.01B (2030) |
| SAM | English-first SMEs/startups (5–250 staff) in US/UK/EU/IN tech & ops sectors that will pay for *agent-building* (not general AI literacy) training | ~150,000 orgs × blended $2,400/org/yr | **~$360M/yr** |
| SOM (Year 1–2) | Wedge vertical (logistics/ops SMEs) + founder-led startups reachable via operator's existing channels | 300 orgs × $2,400/yr | **~$0.7M ARR** |
| SOM (Year 3) | Wedge + 2 adjacent verticals, partner channels | 1,500 orgs × $2,600/yr | **~$3.9M ARR** |

Sanity check: SOM Year 1 requires ~300 paying orgs — aggressive for a solo operator, realistic only with the wedge strategy in §7 (existing Carrier customer base + community distribution). At the recommended Pro tier ($199/mo), 300 orgs ≈ $716k ARR, consistent with the table.

---

## 3. Competitive landscape

Eight competitors scanned — four catalogue incumbents, two premium/cohort players, two agent-specific threats.

| # | Competitor | Audience | Format | Price point | Weakness for SME agent-building |
|---|---|---|---|---|---|
| 1 | **Coursera for Business** | Mid-market + enterprise L&D | Self-paced video, certificates, guided projects | **$399/user/yr** (Teams, ≤499 users) | Generic catalogue; agent content is academic (IBM certs), no coaching on the customer's own codebase; completion is the customer's problem |
| 2 | **Udemy Business** | SME → enterprise | Self-paced video marketplace (28k+ courses) | **$360/user/yr** (Team, 2–50 users) | Quality variance; teaches tools in isolation; zero accountability or evidence of skill transfer |
| 3 | **LinkedIn Learning** | Mixed-role companies | Self-paced video + AI coaching features at enterprise tier | **$379.88/seat/yr** (Teams, 2–20 licences) | Breadth over depth; agent-building coverage is introductory; tied to LinkedIn ecosystem, not to shipping systems |
| 4 | **DeepLearning.AI** | Individual engineers | Video courses co-created with framework owners (Andrew Ng's *Agentic AI*, LangGraph courses) | Free to audit; **Pro $25/mo billed yearly** for projects + certificate | Superb content, wrong buyer: sells to individuals, no org seats, no team progress evidence, no work on the learner's own product |
| 5 | **LangChain Academy + Hugging Face Agents Course** | Developers | Free video + notebooks, framework-official | **$0** (paid LangChain certification exam separate) | The most dangerous competitor: authoritative, free, current. But framework-specific, self-directed, no coach, no done-tests, no org reporting — teaches *LangGraph*, not *how to run agents safely in your business* |
| 6 | **Maven (cohorts)** | Professionals / eng & PM leaders | Live 4–8 week cohorts | **$900** (AI Agent Design) to **$3,599** (Agentic AI PM cert) to **$4,500** (AI Evals) per person | Proves willingness-to-pay for outcomes, but: fixed cohort dates, per-person pricing an SME can't scale, no persistent platform or post-course system |
| 7 | **Section (Section AI)** | Executives / business leaders | Mini-MBA style sprints + live discussion | **$295–$895 per sprint** | Strategy-level, not builder-level; no hands-on agent construction for SME staff |
| 8 | **Replit (learn-by-building, adjacent)** | Builders, startups | AI coding environment with agent; learning is a by-product | Core **$20/mo**, Pro **$100/mo** | Owns the "build with AI" habit loop and startup distribution; could add structured agent curriculum and squeeze from below — but today sells an environment, not a curriculum, coach, or evidence of learning |

Price sources: Coursera/Udemy/LinkedIn team pricing — https://www.datacamp.com/blog/best-gemini-training-for-employees and https://edubracket.com/articles/datacamp-vs-coursera-vs-udemy-business-2026 ; DeepLearning.AI Pro and free agent courses — https://www.systemdesign.academy/best-agentic-ai-course and https://taku.ai/blog/ai-agents-courses ; Maven cohort prices — https://www.allthingspm.app/blog/best-maven-courses-for-product-managers and https://missiongraduatenm.org/ai-agent-courses/ ; Section sprints — https://shipset.app/best-ai-pm-courses ; Replit — https://devhunt.org/ai-coding-agents/replit/pricing

**Competitive conclusion:** The market is bifurcated — *cheap, passive, generic* ($0–$399/seat/yr, video) vs *expensive, live, episodic* ($900–$4,500/person, cohorts). **Nobody sells a persistent, per-org subscription where an AI coach makes SME staff ship agent systems on their own product with evidence-gated progress.** That empty middle is the product.

---

## 4. Customer: SME & startup personas

**Persona A — "The Operator-Founder" (wedge persona).** 10–60 staff logistics/ops/services company. Already pays for SaaS (the operator's Carrier customers are literally this persona). Has 1–3 "technical-ish" staff, no AI engineer, a backlog of manual workflows (email triage, document chasing, dispatch). Buys when shown: "your team ships a working agent for *your* inbox in 6 weeks, and here's the evidence dashboard." Price-sensitive but ROI-literate; churns if staff don't finish.

**Persona B — "The Startup CTO/Head of Eng."** 5–30 person startup. Team can code but is self-taught on agents via X/YouTube; production agents keep failing on evals, runaway loops, no human gates. Buys the *method* (checks, gates, failure rules) and team standardisation. Least price-sensitive; most likely Premium tier; churns if content goes stale vs free framework material.

**Persona C — "The Agency/Consultancy Owner."** Builds automations for clients. Buys seats to standardise delivery quality and to resell capability. High expansion potential (seats grow with headcount) and a natural referral channel.

**Anti-persona (do not sell to at launch):** enterprise L&D (procurement cycles, SSO/SCORM demands exceed a Workers+D1 MVP), solo learners (DeepLearning.AI/free content wins; ARPU too low), and non-technical "AI literacy" buyers (commodity, Coursera wins).

**Jobs-to-be-done, in buyer language:** (1) "Make my existing staff able to build agents — I can't hire this." (2) "Prove to me it worked — show me what they shipped, not hours watched." (3) "Don't let them build something dangerous" — the security/gating curriculum is a buying reason for owners, not a feature.

---

## 5. Pricing analysis & recommendation

### 5.1 Benchmarks

- **Catalogue team learning (the budget line SMEs already pay):** $360–399 per seat per year ≈ **$30–33/seat/mo** (Udemy Business $360, LinkedIn Learning $379.88, Coursera Teams $399). DataCamp Teams undercuts at $168/seat/yr for data content. (Sources in §3.)
- **Specialist per-seat norms:** digital-skills platforms cluster at **£200–£600 per learner per year**; AI-native adaptive platforms at £8–£25 per active user/mo. The known failure mode: per-seat annual licences with ~40% non-use double the effective cost per active learner — the argument for per-org pricing with included seats and completion evidence. (https://www.tiqplus.com/topics/digital-skills-training-software.html)
- **Outcome-priced learning (the willingness-to-pay ceiling):** Maven agent/evals cohorts at **$900–$4,500 per person for 4–8 weeks**; live mentored agent courses ~$400/person. Buyers pay 10× catalogue prices when a human-verified outcome is attached. (Sources in §3.)
- **Completion economics:** self-paced completion medians are ~12.6% (Jordan 2015) and 3.13% for MIT/Harvard MOOCs (Science, 2019), vs 60–96% for cohort/structured formats. A product that can credibly move an SME team from ~10% to even 40% completion owns a pricing argument no catalogue can match. (https://www.disco.co/blog/why-self-paced-learning-has-a-completion-problem-and-what-actually-works ; https://mentivisos.com/en/referentiel/mon-lms-ne-sert-a-rien-pourquoi-les-taux-de-completion-s-effondrent/)

### 5.2 Recommended ladder — price ABOVE the operator's Carrier SaaS, deliberately

Carrier prices ($14.99/$29.99/$49.99 per month) are set for a single-operator trucking tool with near-zero marginal cost. This platform is a different budget line (L&D / capability-building, judged against $360+/seat/yr incumbents and $900+ cohorts), carries real per-seat AI-coach inference cost, and anchors *below* catalogue per-seat economics while charging for outcomes. Pricing it at Carrier levels would (a) signal "toy", (b) leave no margin for coach inference + content updates, and (c) strand it under the buyer's mental floor for team training. **Recommendation: per-org flat tiers with included seats** (matches SME buying behaviour, avoids per-seat non-use resentment, mirrors the operator's existing org-account model).

| Tier | Price (monthly) | Price (annual, 2 months free) | Seats included | What's in it |
|---|---|---|---|---|
| **Starter** | **$79/mo** | $790/yr | 5 | Loops & Graphs core curriculum (6 modules), AI coach, drills on own projects, done-test evidence dashboard |
| **Pro** | **$199/mo** | $1,990/yr | 15 | Everything in Starter + capstone with gated review, team progress reporting for owners, security & gating track, priority content updates |
| **Premium** | **$449/mo** | $4,490/yr | 40 | Everything in Pro + custom tracks per role, monthly human expert review session, private org workspace, SSO, audit log of agent work |

**Justification, per seat:** Pro works out to **~$13/seat/mo at full utilisation — less than half the $30–33/seat/mo catalogue anchor** — while delivering coaching and shipped outcomes the catalogues don't. Premium at 40 seats is ~$11/seat/mo, still under anchor, with the margin carried by services (human review) rather than content. Extra seats: $12/seat/mo add-on, any tier. **Trial:** 14-day, card-free, org-level (consistent with the operator's Carrier launch principles: never cripple the core job, soft limits, remind before first charge once billing is live). **Founding offer for the wedge:** first 25 logistics orgs at Pro for $149/mo locked 12 months — buys testimonials and completion data, the two assets that sell tier 2.

**Unit-economics guardrail:** AI-coach inference is the variable cost. On Cloudflare Workers AI / low-cost models for drill feedback with a stronger model reserved for capstone gating (the curriculum's own "smallest model that clears the bar, strongest model on the gate" rule), target coach cost ≤ $3/active learner/mo, keeping gross margin ≥ 75% at Pro. If measured coach cost exceeds $6/active learner/mo, introduce fair-use coach caps on Starter before raising prices.

---

## 6. The gap — is the differentiation real?

**The claim:** "Learn agents by building them on your own product, with an AI coach and evidence-gated progress."

**Where it is genuinely differentiated:**
1. **Context:** Every competitor teaches on *their* examples. Drills on the learner's own codebase/workflows convert training into shipped internal tools — the course fee is recovered in the capstone artefact itself. No scanned competitor offers this to SMEs.
2. **Evidence instead of attendance:** Done-tests (tests passing, schema-valid output, diff-in-scope) give the *owner* proof of capability — directly answering the #2 buyer job in §4 and the industry's completion crisis (§5.1).
3. **The method is the safety story:** Checks, stop conditions, reversibility gates, and failure rules are exactly the disciplines whose absence Gartner blames for 40%+ of agent project cancellations. Teaching *safe* agent-building to SMEs — for whom one runaway agent touches real customers and real money — is a sharper wedge than teaching agent-building at all.
4. **Price/form-factor white space:** Persistent per-org subscription between $399/seat/yr passive catalogues and $900+/person episodic cohorts (§3 conclusion).

**Where it is NOT differentiated (honest assessment):**
- The *knowledge* is a commodity and getting cheaper: the framework owners give away excellent courses free, and high-quality X/YouTube content (including the very "Loops & Graphs" article that inspired this product) is one search away. **Content cannot be the moat.** The moat, if any, is the coach's integration with the learner's real work, the evidence trail, and vertical-specific drills.
- An AI coach is replicable: any incumbent can bolt an LLM tutor onto a catalogue (LinkedIn Learning already ships AI coaching at enterprise tier). The window is execution speed and vertical depth, not technology.

### Risks & mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| **Free-content substitution** — buyers ask "why not LangChain Academy + YouTube?" | High | Never sell content; sell shipped outcomes + owner evidence. Bundle the free resources *inside* the curriculum and charge for coaching, gating, and proof |
| **Churn after capstone** — team finishes, cancels ("course completed" mindset) | High | Design for continuity: monthly new drills on the org's live systems, framework-update tracks (the field moves monthly), alumni agent-health checks. Price annually with the 2-months-free lever |
| **AI-coach quality** — a coach that passes bad work destroys the evidence promise | High | Coach follows the product's own doctrine: programmatic checks first, model judgement last; strongest model only on gates; sample human audits on Premium; publish completion-integrity stats |
| **Content staleness** — frameworks (LangGraph, CrewAI, Burr) rev monthly | Medium | Curriculum as versioned, modular drills, not monolithic video; monthly update cadence is a Pro+ feature; kill modules ruthlessly |
| **Incumbent fast-follow** — Coursera/Udemy add "agent builder tracks with AI coach" | Medium | Vertical depth (logistics first) + own-work integration they can't copy without becoming a dev-tool; speed to 100 reference orgs before they notice the niche |
| **Support burden on a solo operator** — orgs expect hand-holding | Medium | Coach-first support, Premium-only human sessions, hard tier boundaries; reuse Carrier's propose→confirm patterns for admin actions |
| **Security/trust** — platform touches learners' real projects and org data | Medium | Security-first posture from day one (operator's standing rule): no storage of customer email bodies/code beyond what's needed, org isolation in D1, audit logs, SSO at Premium. This is also a sales asset for Persona A owners |
| **Market timing** — agent hype deflates if cancellation wave (§2.1) dominates press | Low–Med | Position against the hype: "learn to build agents that *don't* get cancelled" — the failure statistics are the marketing |

---

## 7. Recommendation

### Verdict: **BUILD — as a wedge, with a kill gate.**

Do not build a general "AI learning platform" — that war is lost to free and incumbent content before it starts. Build **LoopForge Academy for one vertical first**, on the operator's proven Cloudflare Workers + D1 + org-accounts + Stripe-subscription chassis (the Carrier SaaS stack is ~80% of the platform plumbing: orgs, seats, trials, soft limits, billing).

### The wedge for the first 100 customers

1. **Customers 1–25 — the Carrier base.** Existing Move2Pick-class logistics SMEs already trust the operator's agent products. Offer: "Your dispatcher/ops lead ships a checked, gated agent for your own inbox/documents in 6 weeks." Founding price $149/mo Pro, locked. Their capstones *are* Carrier-adjacent agent wins — case studies write themselves.
2. **Customers 26–60 — lookalike ops verticals.** Trucking-adjacent and field-service/home-service SMEs (the operator's receptionist-product audience) via the same playbook: one vertical landing page per trade, one public capstone demo per trade.
3. **Customers 61–100 — Persona C agencies.** Automation agencies serving SMEs buy seats to standardise their own delivery; each agency is also a distribution channel into its client base.

### Build sequence (lean, in order)

1. **Platform shell** — org accounts, seats, subscription tiers (§5.2), trial. (Reuse Carrier patterns; no new auth model.)
2. **Curriculum v1** — Loops & Graphs: 6 modules + capstone, drills parameterised by the learner's own project. No video studio: text + coach + checks.
3. **Coach agent** — checked loops inside a gated graph, built *with the method it teaches* (this is both product and proof; the build log is marketing content).
4. **Evidence dashboard** — per-learner done-test artefacts, per-org completion view for owners. This screen is the renewal conversation.
5. **Security baseline** — org isolation, minimal data retention, audit log, published security page before first paying org.

### Validation gates (decide with data, Big-4 style)

| Gate | Timing | Pass | Fail action |
|---|---|---|---|
| Demand | Pre-build, 2 weeks | ≥10 wedge orgs pre-commit (LOI or founding deposit) | Don't build; sell the curriculum as a Maven-style cohort instead |
| Activation | First 30 days | ≥50% of seats start Module 1 within 14 days of org creation | Fix onboarding/drills before any new features |
| Outcome | Day 90 | ≥40% of activated learners pass the capstone done-test; ≥10 paying orgs | Pivot to cohort + human-review model at Premium-only pricing |
| Economics | Day 90 | Coach cost ≤ $3/active learner/mo; gross margin ≥ 75% at Pro | Model-tier rebalance; fair-use caps on Starter |

### What success looks like at month 12

100 orgs × blended ~$190/mo ≈ **$228k ARR** at ≥75% gross margin, a completion-evidence dataset no competitor can show, and a defensible expansion path: second vertical, agency channel, and a Premium tier anchored on human-reviewed capstones. That — not a content library — is the asset worth building.

---

## Appendix — Sources

- AI in corporate training market size/CAGR — https://www.thebusinessresearchcompany.com/report/artificial-intelligence-ai-in-corporate-training-market-report
- Agentic AI spend forecast (Gartner) — https://emt.gartnerweb.com/ngw/globalassets/en/insights/documents/forecast-analysis-agentic-ai-spending-in-software-markets.pdf
- Agentic AI adoption & cancellation statistics (compiled, Gartner/McKinsey/Google Cloud) — https://report-ai.org/indexes/enterprise-ai/agentic-ai-statistics-2026/
- SME AI adoption, official sources compiled — https://www.omago.ai/blog/sme-ai-adoption-2026-data ; https://mellekis.com/research/state-of-ai-adoption-smes-ireland-uk-eu-2026
- EY Work Reimagined 2025 (training deficit) — https://www.ey.com/en_th/newsroom/2025/12/ey-survey-reveals-companies-are-missing-out-on-up-to-40-percent-of-ai-productivity-gains-due-to-gaps-in-talent-strategy
- AI talent gap / WEF / Emergn — https://medium.com/@sellcraft.marketing/ai-talent-gap-a-talent-solution-beyond-hiring-cf4050865eb1 ; https://itbrief.news/story/organisations-face-widening-skills-gap-for-ai-roles
- Team learning pricing benchmarks — https://www.datacamp.com/blog/best-gemini-training-for-employees ; https://edubracket.com/articles/datacamp-vs-coursera-vs-udemy-business-2026 ; https://www.tiqplus.com/topics/digital-skills-training-software.html
- Agent course landscape (DeepLearning.AI, LangChain Academy, Hugging Face) — https://www.systemdesign.academy/best-agentic-ai-course ; https://taku.ai/blog/ai-agents-courses
- Maven / Section pricing — https://www.allthingspm.app/blog/best-maven-courses-for-product-managers ; https://missiongraduatenm.org/ai-agent-courses/ ; https://shipset.app/best-ai-pm-courses
- Replit pricing — https://devhunt.org/ai-coding-agents/replit/pricing
- Completion-rate research — https://www.disco.co/blog/why-self-paced-learning-has-a-completion-problem-and-what-actually-works ; https://mentivisos.com/en/referentiel/mon-lms-ne-sert-a-rien-pourquoi-les-taux-de-completion-s-effondrent/

*Note: TAM/SAM/SOM org counts in §2.3 are stated planning assumptions for decision-making, not sourced market statistics. All other figures are cited inline.*
