// Loopforge Academy — unit tests for the pure logic (no Worker boot needed).
// Run: node tests/run.mjs   (or: npm test)
import assert from 'node:assert/strict';
import { PLANS, getPlan, seatCheck, gateDecision, isGateExempt } from '../src/plans.js';
import { hashPassword, verifyPassword, hashToken, newSessionToken } from '../src/auth.js';

let passed = 0;
function ok(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => { passed++; console.log(`  PASS ${name}`); })
    .catch((err) => { console.error(`  FAIL ${name}: ${err.message}`); process.exitCode = 1; });
}

console.log('Loopforge Academy tests');

await ok('plan ladder: Starter $79/5, Pro $199/15, Premium $449/40', () => {
  assert.equal(PLANS.starter.priceMonthly, 79);
  assert.equal(PLANS.starter.seats, 5);
  assert.equal(PLANS.pro.priceMonthly, 199);
  assert.equal(PLANS.pro.seats, 15);
  assert.equal(PLANS.premium.priceMonthly, 449);
  assert.equal(PLANS.premium.seats, 40);
  assert.equal(getPlan('nonsense').id, 'starter');
});

await ok('seat check: within limit — no warning, not blocked', () => {
  const r = seatCheck('starter', 4, 'soft'); // 4 + 1 = 5 = limit
  assert.equal(r.seatsUsed, 5);
  assert.equal(r.overLimit, false);
  assert.equal(r.blocked, false);
  assert.equal(r.warning, null);
});

await ok('seat check: over limit in SOFT mode warns but never blocks', () => {
  const r = seatCheck('starter', 5, 'soft'); // 5 + 1 = 6 > 5
  assert.equal(r.overLimit, true);
  assert.equal(r.blocked, false);
  assert.ok(r.warning && r.warning.includes('Soft limits'));
});

await ok('seat check: over limit in HARD mode blocks', () => {
  const r = seatCheck('starter', 5, 'hard');
  assert.equal(r.blocked, true);
});

await ok('gate: trialing with time left allows', () => {
  const future = new Date(Date.now() + 86400000).toISOString();
  assert.equal(gateDecision({ status: 'trialing', trial_ends_at: future }).allow, true);
});

await ok('gate: trialing past trial end denies (trial_expired)', () => {
  const past = new Date(Date.now() - 86400000).toISOString();
  const d = gateDecision({ status: 'trialing', trial_ends_at: past });
  assert.equal(d.allow, false);
  assert.equal(d.reason, 'trial_expired');
});

await ok('gate: active and past_due allow; canceled/expired/missing deny', () => {
  assert.equal(gateDecision({ status: 'active' }).allow, true);
  assert.equal(gateDecision({ status: 'past_due' }).allow, true);
  assert.equal(gateDecision({ status: 'canceled' }).allow, false);
  assert.equal(gateDecision({ status: 'expired' }).allow, false);
  assert.equal(gateDecision(null).allow, false);
});

await ok('gate exemptions: login/me/billing/setup reachable, app APIs not', () => {
  assert.equal(isGateExempt('/api/login'), true);
  assert.equal(isGateExempt('/api/me'), true);
  assert.equal(isGateExempt('/api/billing'), true);
  assert.equal(isGateExempt('/api/billing/checkout'), true);
  assert.equal(isGateExempt('/api/setup'), true);
  assert.equal(isGateExempt('/api/modules'), false);
  assert.equal(isGateExempt('/api/coach'), false);
});

await ok('PBKDF2 hash/verify round-trip', async () => {
  const stored = await hashPassword('correct horse battery staple');
  assert.ok(stored.hash && stored.salt && stored.iterations >= 100000);
  assert.equal(await verifyPassword('correct horse battery staple', stored), true);
  assert.equal(await verifyPassword('wrong password', stored), false);
  assert.equal(await verifyPassword('correct horse battery staple', null), false);
});

await ok('PBKDF2 salts differ between hashes of the same password', async () => {
  const a = await hashPassword('same-password');
  const b = await hashPassword('same-password');
  assert.notEqual(a.hash, b.hash);
  assert.notEqual(a.salt, b.salt);
});

await ok('session tokens: stored hash differs from token, stable, tokens unique', async () => {
  const t1 = newSessionToken();
  const t2 = newSessionToken();
  assert.notEqual(t1, t2);
  const h1 = await hashToken(t1);
  assert.notEqual(h1, t1);
  assert.equal(h1, await hashToken(t1));
  assert.match(h1, /^[0-9a-f]{64}$/);
});

console.log(process.exitCode ? '\nFAILED' : `\nAll ${passed} tests passed`);
