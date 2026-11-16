// Loopforge Academy — Cloudflare Worker API + SPA host.
// Vanilla Worker, D1, Workers AI. No frameworks, no build step.
// Rules baked in: org_id enforced on every query, PBKDF2 passwords,
// hashed session tokens, soft seat limits, subscription gate (402) with
// login/me/billing/setup always reachable, JSON-only API errors,
// security headers on every response.

import { PLANS, TRIAL_DAYS, getPlan, seatCheck, gateDecision, isGateExempt } from './plans.js';
import { hashPassword, verifyPassword, hashToken, newSessionToken } from './auth.js';
import { SCHEMA_STATEMENTS, MODULE_SEED } from './schema.js';
import { LESSONS } from './lessons.js';
import { coachSystemPrompt, FALLBACK_MESSAGE, COACH_RATE_LIMIT_PER_HOUR } from './coach.js';

const SESSION_COOKIE = 'lf_session';
const SESSION_DAYS = 30;

// ---------- response helpers ----------

function securityHeaders(resp) {
  const r = new Response(resp.body, resp);
  r.headers.set('Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; " +
    "connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
  r.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  r.headers.set('X-Content-Type-Options', 'nosniff');
  r.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  r.headers.set('X-Frame-Options', 'DENY');
  return r;
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

function apiError(code, status, extra = {}) {
  return json({ error: code, ...extra }, status);
}

async function readBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function sessionCookie(request, token, maxAgeSeconds) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}${secure}`;
}

function readSessionCookie(request) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === SESSION_COOKIE) return v.join('=');
  }
  return null;
}

// ---------- auth / audit ----------

async function audit(env, orgId, userId, action, detail = '') {
  try {
    await env.DB.prepare(
      'INSERT INTO audit_log (org_id, user_id, action, detail) VALUES (?, ?, ?, ?)'
    ).bind(orgId, userId, action, detail).run();
  } catch {
    // Audit must never break the request path.
  }
}

async function createSession(env, request, userId) {
  const token = newSessionToken();
  const tokenHash = await hashToken(token);
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  await env.DB.prepare(
    'INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)'
  ).bind(userId, tokenHash, expires).run();
  return sessionCookie(request, token, SESSION_DAYS * 86400);
}

async function currentUser(env, request) {
  const token = readSessionCookie(request);
  if (!token) return null;
  const tokenHash = await hashToken(token);
  const row = await env.DB.prepare(
    `SELECT u.id, u.org_id, u.email, u.name, u.role
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > datetime('now')`
  ).bind(tokenHash).first();
  return row || null;
}

async function getSubscription(env, orgId) {
  return env.DB.prepare('SELECT * FROM subscriptions WHERE org_id = ?').bind(orgId).first();
}

// ---------- handlers ----------

async function handleSetup(env, request) {
  const body = await readBody(request);
  const key = request.headers.get('X-Setup-Key') || body.setup_key || '';
  if (!env.SETUP_KEY || key !== env.SETUP_KEY) return apiError('UNAUTHORIZED', 401);

  const statements = SCHEMA_STATEMENTS.map((sql) => env.DB.prepare(sql));
  for (const [slug, title, concepts, position] of MODULE_SEED) {
    statements.push(
      env.DB.prepare(
        'INSERT OR IGNORE INTO modules (slug, title, concepts, position) VALUES (?, ?, ?, ?)'
      ).bind(slug, title, concepts, position)
    );
  }
  await env.DB.batch(statements);

  // Seed lessons per module, only where a module has none yet (idempotent).
  let lessonsSeeded = 0;
  for (const [slug, lessonList] of Object.entries(LESSONS)) {
    const mod = await env.DB.prepare('SELECT id FROM modules WHERE slug = ?').bind(slug).first();
    if (!mod) continue;
    const existing = await env.DB.prepare(
      'SELECT COUNT(*) AS n FROM lessons WHERE module_id = ?'
    ).bind(mod.id).first();
    if (existing && existing.n > 0) continue;
    const inserts = lessonList.map((lesson, i) =>
      env.DB.prepare(
        'INSERT INTO lessons (module_id, title, body_md, position) VALUES (?, ?, ?, ?)'
      ).bind(mod.id, lesson.title, lesson.body_md, i + 1)
    );
    if (inserts.length) {
      await env.DB.batch(inserts);
      lessonsSeeded += inserts.length;
    }
  }
  return json({ ok: true, message: 'Schema and seed data are in place. Existing data was not changed.', lessonsSeeded });
}

async function handleSignup(env, request) {
  const body = await readBody(request);
  const orgName = String(body.org_name || '').trim();
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const plan = PLANS[body.plan] ? body.plan : 'starter';
  if (!orgName || !email || password.length < 8) {
    return apiError('VALIDATION', 400, { message: 'org_name, a valid email and a password of 8+ characters are required.' });
  }
  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) return apiError('EMAIL_TAKEN', 409, { message: 'An account with this email already exists.' });

  const org = await env.DB.prepare('INSERT INTO organisations (name) VALUES (?) RETURNING id').bind(orgName).first();
  const pw = await hashPassword(password);
  const user = await env.DB.prepare(
    `INSERT INTO users (org_id, email, name, role, password_hash, password_salt, password_iterations)
     VALUES (?, ?, ?, 'admin', ?, ?, ?) RETURNING id`
  ).bind(org.id, email, name, pw.hash, pw.salt, pw.iterations).first();

  const trialEnds = new Date(Date.now() + TRIAL_DAYS * 86400000).toISOString();
  await env.DB.prepare(
    `INSERT INTO subscriptions (org_id, plan, status, trial_ends_at) VALUES (?, ?, 'trialing', ?)`
  ).bind(org.id, plan, trialEnds).run();

  await audit(env, org.id, user.id, 'signup', `org "${orgName}" on ${plan} plan, ${TRIAL_DAYS}-day trial`);
  const cookie = await createSession(env, request, user.id);
  return json(
    { ok: true, user: { id: user.id, email, name, role: 'admin', org_id: org.id }, trial_ends_at: trialEnds },
    201,
    { 'Set-Cookie': cookie }
  );
}

async function handleLogin(env, request) {
  const body = await readBody(request);
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  const ok = user && (await verifyPassword(password, {
    hash: user.password_hash, salt: user.password_salt, iterations: user.password_iterations,
  }));
  if (!ok) return apiError('INVALID_CREDENTIALS', 401, { message: 'Email or password is incorrect.' });

  await audit(env, user.org_id, user.id, 'login', '');
  const cookie = await createSession(env, request, user.id);
  return json(
    { ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role, org_id: user.org_id } },
    200,
    { 'Set-Cookie': cookie }
  );
}

async function handleLogout(env, request) {
  const token = readSessionCookie(request);
  if (token) {
    const tokenHash = await hashToken(token);
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
  }
  return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(request, '', 0) });
}

async function handleMe(env, user) {
  const org = await env.DB.prepare('SELECT id, name FROM organisations WHERE id = ?').bind(user.org_id).first();
  const sub = await getSubscription(env, user.org_id);
  return json({ user, org, subscription: sub });
}

async function handleModules(env, user) {
  const { results } = await env.DB.prepare(
    `SELECT m.id, m.slug, m.title, m.concepts, m.position,
            COALESCE(p.status, 'not_started') AS my_status
       FROM modules m
       LEFT JOIN progress p ON p.module_id = m.id AND p.user_id = ?
      ORDER BY m.position`
  ).bind(user.id).all();
  return json({ modules: results });
}

async function handleModuleDetail(env, user, slug) {
  const mod = await env.DB.prepare('SELECT * FROM modules WHERE slug = ?').bind(slug).first();
  if (!mod) return apiError('NOT_FOUND', 404);
  const { results: lessons } = await env.DB.prepare(
    'SELECT id, title, body_md, position FROM lessons WHERE module_id = ? ORDER BY position'
  ).bind(mod.id).all();
  const progress = await env.DB.prepare(
    'SELECT * FROM progress WHERE user_id = ? AND module_id = ?'
  ).bind(user.id, mod.id).first();
  return json({ module: mod, lessons, progress: progress || { status: 'not_started', evidence_text: '', review_note: '' } });
}

async function handleProgressSubmit(env, user, request) {
  const body = await readBody(request);
  const slug = String(body.module_slug || '');
  const evidence = String(body.evidence_text || '').trim();
  if (!evidence) return apiError('VALIDATION', 400, { message: 'evidence_text is required — a done-test is reviewed on evidence.' });
  const mod = await env.DB.prepare('SELECT id FROM modules WHERE slug = ?').bind(slug).first();
  if (!mod) return apiError('NOT_FOUND', 404);
  await env.DB.prepare(
    `INSERT INTO progress (user_id, module_id, status, evidence_text, updated_at)
     VALUES (?, ?, 'submitted', ?, datetime('now'))
     ON CONFLICT(user_id, module_id) DO UPDATE SET
       status = 'submitted', evidence_text = excluded.evidence_text,
       updated_at = datetime('now')`
  ).bind(user.id, mod.id, evidence).run();
  await audit(env, user.org_id, user.id, 'progress_submit', `module ${slug}`);
  return json({ ok: true, status: 'submitted' });
}

async function handleReviewQueue(env, user) {
  if (user.role !== 'admin') return apiError('FORBIDDEN', 403);
  const { results } = await env.DB.prepare(
    `SELECT p.id, p.status, p.evidence_text, p.updated_at,
            u.id AS user_id, u.email AS user_email, u.name AS user_name,
            m.slug AS module_slug, m.title AS module_title
       FROM progress p
       JOIN users u ON u.id = p.user_id
       JOIN modules m ON m.id = p.module_id
      WHERE u.org_id = ? AND p.status = 'submitted'
      ORDER BY p.updated_at ASC`
  ).bind(user.org_id).all();
  return json({ queue: results });
}

async function handleProgressReview(env, user, request) {
  if (user.role !== 'admin') return apiError('FORBIDDEN', 403);
  const body = await readBody(request);
  const progressId = Number(body.progress_id);
  const decision = body.decision === 'approve' ? 'done' : body.decision === 'return' ? 'returned' : null;
  const note = String(body.note || '');
  if (!progressId || !decision) return apiError('VALIDATION', 400, { message: 'progress_id and decision (approve|return) are required.' });
  // org_id enforced: the submission must belong to the reviewer's organisation.
  const row = await env.DB.prepare(
    `SELECT p.id, p.user_id, m.slug FROM progress p
       JOIN users u ON u.id = p.user_id JOIN modules m ON m.id = p.module_id
      WHERE p.id = ? AND u.org_id = ?`
  ).bind(progressId, user.org_id).first();
  if (!row) return apiError('NOT_FOUND', 404);
  await env.DB.prepare(
    `UPDATE progress SET status = ?, review_note = ?, reviewed_by = ?, updated_at = datetime('now') WHERE id = ?`
  ).bind(decision, note, user.id, progressId).run();
  await audit(env, user.org_id, user.id, 'progress_review',
    `progress ${progressId} (module ${row.slug}, learner ${row.user_id}) -> ${decision}${note ? `: ${note}` : ''}`);
  return json({ ok: true, status: decision });
}

async function handleTeamList(env, user) {
  const { results } = await env.DB.prepare(
    'SELECT id, email, name, role, created_at FROM users WHERE org_id = ? ORDER BY id'
  ).bind(user.org_id).all();
  const sub = await getSubscription(env, user.org_id);
  const plan = getPlan(sub ? sub.plan : 'starter');
  return json({ members: results, seats_used: results.length, seats_allowed: plan.seats, plan: plan.id });
}

async function handleTeamAdd(env, user, request) {
  if (user.role !== 'admin') return apiError('FORBIDDEN', 403);
  const body = await readBody(request);
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!email || password.length < 8) {
    return apiError('VALIDATION', 400, { message: 'email and a password of 8+ characters are required.' });
  }
  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) return apiError('EMAIL_TAKEN', 409);

  const sub = await getSubscription(env, user.org_id);
  const countRow = await env.DB.prepare('SELECT COUNT(*) AS n FROM users WHERE org_id = ?').bind(user.org_id).first();
  const seats = seatCheck(sub ? sub.plan : 'starter', countRow.n, env.LIMITS_MODE || 'soft');
  // Soft limits: warn, never block. (In hard mode a caller could block on seats.blocked.)
  const pw = await hashPassword(password);
  const created = await env.DB.prepare(
    `INSERT INTO users (org_id, email, name, role, password_hash, password_salt, password_iterations)
     VALUES (?, ?, ?, 'learner', ?, ?, ?) RETURNING id`
  ).bind(user.org_id, email, name, pw.hash, pw.salt, pw.iterations).first();
  await audit(env, user.org_id, user.id, 'member_added', `${email}${seats.warning ? ' (over seat limit — soft)' : ''}`);
  return json({ ok: true, user: { id: created.id, email, name, role: 'learner' }, seat_warning: seats.warning }, 201);
}

async function handleCoach(env, user, request) {
  const body = await readBody(request);
  const message = String(body.message || '').trim();
  if (!message) return apiError('VALIDATION', 400, { message: 'message is required.' });

  const rate = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM coach_messages
      WHERE user_id = ? AND role = 'user' AND created_at > datetime('now', '-1 hour')`
  ).bind(user.id).first();
  if (rate && rate.n >= COACH_RATE_LIMIT_PER_HOUR) {
    return apiError('RATE_LIMITED', 429, { message: `Coach limit is ${COACH_RATE_LIMIT_PER_HOUR} messages per hour.` });
  }

  await env.DB.prepare(
    'INSERT INTO coach_messages (org_id, user_id, role, content) VALUES (?, ?, \'user\', ?)'
  ).bind(user.org_id, user.id, message).run();

  let reply = FALLBACK_MESSAGE;
  let fallback = true;
  if (env.AI && env.ASSISTANT_MODEL) {
    try {
      const { results: modules } = await env.DB.prepare(
        'SELECT slug, title, concepts FROM modules ORDER BY position'
      ).all();
      const { results: progress } = await env.DB.prepare(
        `SELECT m.slug AS slug, p.status AS status FROM progress p
           JOIN modules m ON m.id = p.module_id WHERE p.user_id = ?`
      ).bind(user.id).all();
      const { results: history } = await env.DB.prepare(
        `SELECT role, content FROM coach_messages WHERE user_id = ? ORDER BY id DESC LIMIT 10`
      ).bind(user.id).all();
      const messages = [
        { role: 'system', content: coachSystemPrompt({ modules, progress }) },
        ...history.reverse().map((h) => ({ role: h.role, content: h.content })),
        { role: 'user', content: message },
      ];
      const result = await env.AI.run(env.ASSISTANT_MODEL, { messages });
      const text = (result && (result.response || result.result)) || '';
      if (text.trim()) {
        reply = text.trim();
        fallback = false;
      }
    } catch {
      reply = FALLBACK_MESSAGE;
      fallback = true;
    }
  }

  await env.DB.prepare(
    'INSERT INTO coach_messages (org_id, user_id, role, content) VALUES (?, ?, \'assistant\', ?)'
  ).bind(user.org_id, user.id, reply).run();
  return json({ reply, fallback });
}

async function handleBilling(env, user) {
  const sub = await getSubscription(env, user.org_id);
  const plan = getPlan(sub ? sub.plan : 'starter');
  const countRow = await env.DB.prepare('SELECT COUNT(*) AS n FROM users WHERE org_id = ?').bind(user.org_id).first();
  return json({
    plan: { id: plan.id, name: plan.name, price_monthly: plan.priceMonthly, seats: plan.seats },
    plans: Object.values(PLANS).map((p) => ({ id: p.id, name: p.name, price_monthly: p.priceMonthly, seats: p.seats })),
    status: sub ? sub.status : 'none',
    trial_ends_at: sub ? sub.trial_ends_at : null,
    seats_used: countRow.n,
    billing_configured: Boolean(env.STRIPE_SECRET_KEY),
  });
}

function handleBillingStub(env) {
  if (!env.STRIPE_SECRET_KEY) return apiError('BILLING_NOT_CONFIGURED', 503);
  return apiError('BILLING_NOT_IMPLEMENTED_IN_MVP', 503);
}

// ---------- router ----------

async function handleApi(env, request, url) {
  const path = url.pathname;

  if (path === '/api/setup' && request.method === 'POST') return handleSetup(env, request);
  if (path === '/api/signup' && request.method === 'POST') return handleSignup(env, request);
  if (path === '/api/login' && request.method === 'POST') return handleLogin(env, request);
  if (path === '/api/logout' && request.method === 'POST') return handleLogout(env, request);

  const user = await currentUser(env, request);
  if (!user) return apiError('UNAUTHORIZED', 401);

  if (path === '/api/me' && request.method === 'GET') return handleMe(env, user);

  if (path === '/api/billing' && request.method === 'GET') return handleBilling(env, user);
  if ((path === '/api/billing/checkout' || path === '/api/billing/portal') && request.method === 'POST') {
    return handleBillingStub(env);
  }

  // Subscription gate: everything below requires a live trial or subscription.
  if (!isGateExempt(path)) {
    const sub = await getSubscription(env, user.org_id);
    const gate = gateDecision(sub, new Date());
    if (!gate.allow) {
      return apiError('SUBSCRIPTION_INACTIVE', 402, {
        reason: gate.reason,
        message: 'This organisation\'s trial or subscription is not active. Billing stays available so the admin can fix it.',
      });
    }
  }

  if (path === '/api/modules' && request.method === 'GET') return handleModules(env, user);
  const moduleMatch = path.match(/^\/api\/modules\/([a-z0-9-]+)$/);
  if (moduleMatch && request.method === 'GET') return handleModuleDetail(env, user, moduleMatch[1]);
  if (path === '/api/progress' && request.method === 'POST') return handleProgressSubmit(env, user, request);
  if (path === '/api/progress/review-queue' && request.method === 'GET') return handleReviewQueue(env, user);
  if (path === '/api/progress/review' && request.method === 'POST') return handleProgressReview(env, user, request);
  if (path === '/api/team' && request.method === 'GET') return handleTeamList(env, user);
  if (path === '/api/team/members' && request.method === 'POST') return handleTeamAdd(env, user, request);
  if (path === '/api/coach' && request.method === 'POST') return handleCoach(env, user, request);

  return apiError('NOT_FOUND', 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let resp;
    try {
      if (url.pathname.startsWith('/api/')) {
        resp = await handleApi(env, request, url);
      } else if (env.ASSETS) {
        resp = await env.ASSETS.fetch(request);
        if (resp.status === 404 && !url.pathname.includes('.')) {
          resp = await env.ASSETS.fetch(new Request(new URL('/index.html', url.origin), request));
        }
      } else {
        resp = apiError('NOT_FOUND', 404);
      }
    } catch (err) {
      resp = apiError('INTERNAL', 500, { message: 'Unexpected error.' });
    }
    return securityHeaders(resp);
  },
};
