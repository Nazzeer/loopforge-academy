'use strict';
/* Loopforge Academy SPA — vanilla JS, hash routing, no build step. */

const app = document.getElementById('app');
const topnav = document.getElementById('topnav');
const coachFab = document.getElementById('coachFab');
const coachDrawer = document.getElementById('coachDrawer');
const coachLog = document.getElementById('coachLog');

let me = null; // { user, org, subscription }

const PLANS = [
  { id: 'starter', name: 'Starter', price: 79, seats: 5 },
  { id: 'pro', name: 'Pro', price: 199, seats: 15 },
  { id: 'premium', name: 'Premium', price: 449, seats: 40 },
];

// ---------- helpers ----------

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function api(path, options = {}) {
  const resp = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  let data = {};
  try { data = await resp.json(); } catch { data = {}; }
  if (!resp.ok) {
    const err = new Error(data.message || data.error || `Request failed (${resp.status})`);
    err.status = resp.status;
    err.code = data.error;
    err.data = data;
    throw err;
  }
  return data;
}

// Minimal Markdown renderer for lesson bodies (headings, lists, bold, code).
function mdToHtml(md) {
  const lines = String(md || '').split('\n');
  let html = '';
  let inCode = false;
  let inList = false;
  const closeList = () => { if (inList) { html += '</ul>'; inList = false; } };
  const inline = (t) => esc(t)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  for (const raw of lines) {
    const line = raw;
    if (line.trim().startsWith('```')) {
      if (inCode) { html += '</code></pre>'; inCode = false; }
      else { closeList(); html += '<pre><code>'; inCode = true; }
      continue;
    }
    if (inCode) { html += esc(line) + '\n'; continue; }
    if (/^# /.test(line)) { closeList(); html += `<h1>${inline(line.slice(2))}</h1>`; continue; }
    if (/^## /.test(line)) { closeList(); html += `<h2>${inline(line.slice(3))}</h2>`; continue; }
    if (/^\s*[-*] /.test(line)) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${inline(line.replace(/^\s*[-*] /, ''))}</li>`;
      continue;
    }
    if (/^\s*\d+\. /.test(line)) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${inline(line.replace(/^\s*\d+\. /, ''))}</li>`;
      continue;
    }
    closeList();
    if (line.trim()) html += `<p>${inline(line)}</p>`;
  }
  if (inCode) html += '</code></pre>';
  closeList();
  return html;
}

function statusPill(status) {
  const label = { not_started: 'Not started', in_progress: 'In progress', submitted: 'Submitted', done: 'Done', returned: 'Returned' }[status] || status;
  return `<span class="pill pill-${esc(status)}">${esc(label)}</span>`;
}

function renderNav() {
  if (!me) {
    topnav.innerHTML = '<a href="#/login">Log in</a><a href="#/signup">Start free trial</a>';
    coachFab.classList.add('hidden');
    return;
  }
  let links = '<a href="#/">Dashboard</a>';
  if (me.user.role === 'admin') links += '<a href="#/admin">Review queue</a>';
  links += '<a href="#/billing">Billing</a>';
  links += `<a href="#" id="logoutLink">Log out (${esc(me.user.email)})</a>`;
  topnav.innerHTML = links;
  coachFab.classList.remove('hidden');
  document.getElementById('logoutLink').addEventListener('click', async (e) => {
    e.preventDefault();
    await api('/api/logout', { method: 'POST' }).catch(() => {});
    me = null;
    renderNav();
    location.hash = '#/';
    route();
  });
}

// ---------- views ----------

function viewLanding() {
  const priceCards = PLANS.map((p) => `
    <div class="card price-card">
      <h3>${p.name}</h3>
      <div class="price">$${p.price}<span class="small muted">/mo</span></div>
      <ul>
        <li>${p.seats} seats included</li>
        <li>All 6 modules + capstone</li>
        <li>Built-in AI coach</li>
        <li>Evidence-gated done-tests</li>
        <li>Every feature — plans differ only by seats</li>
      </ul>
      <a class="btn btn-gold" href="#/signup?plan=${p.id}">Start 14-day free trial</a>
    </div>`).join('');
  app.innerHTML = `
    <h1>Your team can build AI agents.<br><span class="gold">Teach them to build ones that check themselves.</span></h1>
    <p class="lede">Loopforge Academy is the agentic learning platform for SMEs and startups.
    Six modules plus a capstone take your staff from prompting to production agent systems —
    checked loops inside gated graphs — coached by a built-in AI coach and gated by
    evidence-based done-tests, not quizzes.</p>
    <p><a class="btn btn-gold" href="#/signup">Start 14-day free trial</a>
       <a class="btn" href="#/login">Log in</a></p>

    <h2>How it works</h2>
    <div class="grid">
      <div class="card"><h3>1. Learn the loop</h3><p class="soft">Produce → check → fix → repeat.
        A loop is only as good as its check — and a real check is one a program can fail.</p></div>
      <div class="card"><h3>2. Learn the graph</h3><p class="soft">Which units of work exist, in what
        order, and where a human signs off. Gates by reversibility, not by confidence scores.</p></div>
      <div class="card"><h3>3. Prove it with evidence</h3><p class="soft">Every module ends in a done-test
        on the learner's own real work. An admin reviews the evidence — approve, or return with a note.</p></div>
    </div>

    <h2>Pricing</h2>
    <p class="soft">14-day free trial on every plan. No card to start. All features in every plan — you only pay for seats.</p>
    <div class="grid">${priceCards}</div>`;
}

function viewAuth(mode) {
  const isSignup = mode === 'signup';
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const planOptions = PLANS.map((p) =>
    `<option value="${p.id}" ${params.get('plan') === p.id ? 'selected' : ''}>${p.name} — $${p.price}/mo, ${p.seats} seats</option>`).join('');
  app.innerHTML = `
    <div class="card form-box">
      <h2>${isSignup ? 'Start your 14-day free trial' : 'Log in'}</h2>
      <form id="authForm">
        ${isSignup ? '<label>Organisation name</label><input type="text" id="f_org" required>' : ''}
        ${isSignup ? '<label>Your name</label><input type="text" id="f_name">' : ''}
        <label>Email</label><input type="email" id="f_email" required>
        <label>Password</label><input type="password" id="f_password" required>
        ${isSignup ? `<label>Plan</label><select id="f_plan">${planOptions}</select>` : ''}
        <p style="margin-top:16px"><button class="btn btn-gold" type="submit">${isSignup ? 'Create account' : 'Log in'}</button></p>
        <div class="error" id="authError"></div>
      </form>
      <p class="small muted">${isSignup
        ? 'Already have an account? <a href="#/login">Log in</a>'
        : 'New here? <a href="#/signup">Start a free trial</a>'}</p>
    </div>`;
  document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errBox = document.getElementById('authError');
    errBox.textContent = '';
    try {
      if (isSignup) {
        await api('/api/signup', {
          method: 'POST',
          body: JSON.stringify({
            org_name: document.getElementById('f_org').value,
            name: document.getElementById('f_name').value,
            email: document.getElementById('f_email').value,
            password: document.getElementById('f_password').value,
            plan: document.getElementById('f_plan').value,
          }),
        });
      } else {
        await api('/api/login', {
          method: 'POST',
          body: JSON.stringify({
            email: document.getElementById('f_email').value,
            password: document.getElementById('f_password').value,
          }),
        });
      }
      await loadMe();
      location.hash = '#/';
      route();
    } catch (err) {
      errBox.textContent = err.message;
    }
  });
}

async function viewDashboard() {
  let data;
  try {
    data = await api('/api/modules');
  } catch (err) {
    if (err.status === 402) return viewSubscriptionBlocked(err);
    throw err;
  }
  const cards = data.modules.map((m) => `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <h3 style="margin:0">${esc(m.title)}</h3>${statusPill(m.my_status)}
      </div>
      <p class="soft">${esc(m.concepts)}</p>
      <a class="btn" href="#/module/${esc(m.slug)}">Open module</a>
    </div>`).join('');
  const sub = me.subscription || {};
  app.innerHTML = `
    <h2>${esc(me.org ? me.org.name : '')} — your modules</h2>
    <p class="muted">Plan: <strong>${esc(sub.plan || 'starter')}</strong> · Status: <strong>${esc(sub.status || '')}</strong>
    ${sub.trial_ends_at ? ` · Trial ends: ${esc(String(sub.trial_ends_at).slice(0, 10))}` : ''}</p>
    ${cards}`;
}

function viewSubscriptionBlocked(err) {
  app.innerHTML = `
    <div class="card">
      <h2>Subscription inactive</h2>
      <p class="soft">${esc(err.message || 'This organisation\'s trial or subscription is not active.')}</p>
      <p><a class="btn btn-gold" href="#/billing">Go to billing</a></p>
    </div>`;
}

async function viewModule(slug) {
  let data;
  try {
    data = await api(`/api/modules/${encodeURIComponent(slug)}`);
  } catch (err) {
    if (err.status === 402) return viewSubscriptionBlocked(err);
    app.innerHTML = `<div class="card"><h2>Not found</h2><p class="soft">${esc(err.message)}</p></div>`;
    return;
  }
  const lessons = data.lessons.map((l) => `
    <div class="card">
      <h3>${esc(l.title)}</h3>
      <div class="lesson-body">${mdToHtml(l.body_md)}</div>
    </div>`).join('');
  const p = data.progress || {};
  app.innerHTML = `
    <p><a href="#/">← All modules</a></p>
    <h2>${esc(data.module.title)} ${statusPill(p.status || 'not_started')}</h2>
    <p class="soft">${esc(data.module.concepts)}</p>
    ${lessons}
    <div class="card">
      <h3>Submit your done-test evidence</h3>
      ${p.review_note ? `<p class="notice">Reviewer note: ${esc(p.review_note)}</p>` : ''}
      <p class="soft small">Evidence first: the runnable check, the failing run, the fixed run.
      Your organisation's admin reviews this — approve means done, return means fix the named unit.</p>
      <form id="evidenceForm">
        <textarea id="evidenceText" placeholder="Paste or describe your evidence…">${esc(p.evidence_text || '')}</textarea>
        <p><button class="btn btn-gold" type="submit">Submit evidence</button></p>
        <div class="notice" id="evidenceMsg"></div>
        <div class="error" id="evidenceErr"></div>
      </form>
    </div>`;
  document.getElementById('evidenceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('evidenceMsg');
    const errB = document.getElementById('evidenceErr');
    msg.textContent = ''; errB.textContent = '';
    try {
      await api('/api/progress', {
        method: 'POST',
        body: JSON.stringify({ module_slug: slug, evidence_text: document.getElementById('evidenceText').value }),
      });
      msg.textContent = 'Submitted. Your admin can now review it in the review queue.';
    } catch (err) {
      errB.textContent = err.message;
    }
  });
}

async function viewAdmin() {
  if (!me || me.user.role !== 'admin') {
    app.innerHTML = '<div class="card"><h2>Admins only</h2><p class="soft">The review queue is for organisation admins.</p></div>';
    return;
  }
  const [queueData, teamData] = await Promise.all([
    api('/api/progress/review-queue').catch((e) => ({ queue: [], error: e })),
    api('/api/team').catch(() => ({ members: [], seats_used: 0, seats_allowed: 0 })),
  ]);
  const rows = (queueData.queue || []).map((q) => `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <h3 style="margin:0">${esc(q.module_title)}</h3>${statusPill(q.status)}
      </div>
      <p class="small muted">From ${esc(q.user_name || '')} (${esc(q.user_email)}) · ${esc(String(q.updated_at || '').slice(0, 16))}</p>
      <p class="soft" style="white-space:pre-wrap">${esc(q.evidence_text)}</p>
      <input type="text" id="note_${q.id}" placeholder="Reviewer note (required when returning)">
      <p>
        <button class="btn btn-gold" data-review="approve" data-id="${q.id}">Approve — done</button>
        <button class="btn" data-review="return" data-id="${q.id}">Return with note</button>
      </p>
    </div>`).join('');
  const members = (teamData.members || []).map((m) =>
    `<tr><td>${esc(m.name || '')}</td><td>${esc(m.email)}</td><td>${esc(m.role)}</td></tr>`).join('');
  app.innerHTML = `
    <h2>Review queue</h2>
    ${rows || '<div class="card"><p class="soft">Nothing waiting. Submissions appear here when a learner submits done-test evidence.</p></div>'}
    <div class="error" id="adminErr"></div>
    <h2>Team — ${teamData.seats_used} of ${teamData.seats_allowed} seats used</h2>
    <div class="card">
      <table><tr><th>Name</th><th>Email</th><th>Role</th></tr>${members}</table>
      <h3>Add a learner</h3>
      <form id="memberForm">
        <label>Name</label><input type="text" id="m_name">
        <label>Email</label><input type="email" id="m_email" required>
        <label>Temporary password (8+ characters)</label><input type="password" id="m_password" required>
        <p><button class="btn btn-gold" type="submit">Add member</button></p>
        <div class="notice" id="memberMsg"></div>
        <div class="error" id="memberErr"></div>
      </form>
    </div>`;
  app.querySelectorAll('[data-review]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const decision = btn.getAttribute('data-review');
      const note = document.getElementById(`note_${id}`).value;
      try {
        await api('/api/progress/review', {
          method: 'POST',
          body: JSON.stringify({ progress_id: Number(id), decision, note }),
        });
        viewAdmin();
      } catch (err) {
        document.getElementById('adminErr').textContent = err.message;
      }
    });
  });
  document.getElementById('memberForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('memberMsg');
    const errB = document.getElementById('memberErr');
    msg.textContent = ''; errB.textContent = '';
    try {
      const res = await api('/api/team/members', {
        method: 'POST',
        body: JSON.stringify({
          name: document.getElementById('m_name').value,
          email: document.getElementById('m_email').value,
          password: document.getElementById('m_password').value,
        }),
      });
      msg.textContent = 'Member added.' + (res.seat_warning ? ` Note: ${res.seat_warning}` : '');
      setTimeout(viewAdmin, 1200);
    } catch (err) {
      errB.textContent = err.message;
    }
  });
}

async function viewBilling() {
  const b = await api('/api/billing');
  const rows = b.plans.map((p) => `
    <tr${p.id === b.plan.id ? ' style="color:var(--gold)"' : ''}>
      <td>${esc(p.name)}${p.id === b.plan.id ? ' (current)' : ''}</td>
      <td>$${p.price_monthly}/mo</td><td>${p.seats} seats</td>
    </tr>`).join('');
  app.innerHTML = `
    <h2>Billing</h2>
    <div class="card">
      <p>Current plan: <strong>${esc(b.plan.name)}</strong> — $${b.plan.price_monthly}/mo · ${b.seats_used} of ${b.plan.seats} seats used</p>
      <p>Status: <strong>${esc(b.status)}</strong>${b.trial_ends_at ? ` · Trial ends ${esc(String(b.trial_ends_at).slice(0, 10))}` : ''}</p>
      <table><tr><th>Plan</th><th>Price</th><th>Seats</th></tr>${rows}</table>
      <p style="margin-top:14px">
        <button class="btn btn-gold" id="checkoutBtn">Upgrade / change plan</button>
        <button class="btn" id="portalBtn">Manage billing</button>
      </p>
      <div class="error" id="billingErr"></div>
      ${b.billing_configured ? '' : '<p class="small muted">Card payments are not switched on yet — your trial runs without a card. Checkout opens when the operator connects Stripe.</p>'}
    </div>`;
  const wire = (id, path) => document.getElementById(id).addEventListener('click', async () => {
    const errB = document.getElementById('billingErr');
    errB.textContent = '';
    try {
      await api(path, { method: 'POST', body: '{}' });
    } catch (err) {
      errB.textContent = err.code === 'BILLING_NOT_CONFIGURED'
        ? 'Billing is not configured yet. Your trial/subscription state is unchanged.'
        : err.message;
    }
  });
  wire('checkoutBtn', '/api/billing/checkout');
  wire('portalBtn', '/api/billing/portal');
}

// ---------- coach drawer ----------

function coachSay(who, text) {
  const div = document.createElement('div');
  div.className = `coach-msg coach-msg-${who}`;
  div.innerHTML = `<div class="who">${who === 'user' ? 'You' : 'Coach'}</div><div class="bubble"></div>`;
  div.querySelector('.bubble').textContent = text;
  coachLog.appendChild(div);
  coachLog.scrollTop = coachLog.scrollHeight;
}

coachFab.addEventListener('click', () => {
  coachDrawer.classList.remove('hidden');
  coachFab.classList.add('hidden');
  if (!coachLog.children.length) coachSay('assistant', 'Tell me which module you are on and what your drill produced. Evidence first — what did your check catch?');
});
document.getElementById('coachClose').addEventListener('click', () => {
  coachDrawer.classList.add('hidden');
  if (me) coachFab.classList.remove('hidden');
});
document.getElementById('coachForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('coachInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  coachSay('user', text);
  try {
    const res = await api('/api/coach', { method: 'POST', body: JSON.stringify({ message: text }) });
    coachSay('assistant', res.reply);
  } catch (err) {
    coachSay('assistant', `Coach unavailable: ${err.message}`);
  }
});

// ---------- routing ----------

async function loadMe() {
  try {
    me = await api('/api/me');
  } catch {
    me = null;
  }
  renderNav();
}

async function route() {
  const hash = location.hash || '#/';
  const path = hash.split('?')[0];
  try {
    if (path === '#/' || path === '#') {
      if (me) await viewDashboard();
      else viewLanding();
    } else if (path === '#/login') {
      viewAuth('login');
    } else if (path === '#/signup') {
      viewAuth('signup');
    } else if (path.startsWith('#/module/')) {
      if (!me) { viewAuth('login'); return; }
      await viewModule(decodeURIComponent(path.slice('#/module/'.length)));
    } else if (path === '#/admin') {
      if (!me) { viewAuth('login'); return; }
      await viewAdmin();
    } else if (path === '#/billing') {
      if (!me) { viewAuth('login'); return; }
      await viewBilling();
    } else {
      viewLanding();
    }
  } catch (err) {
    app.innerHTML = `<div class="card"><h2>Something went wrong</h2><p class="soft">${esc(err.message)}</p></div>`;
  }
}

window.addEventListener('hashchange', route);
(async () => {
  await loadMe();
  await route();
})();
