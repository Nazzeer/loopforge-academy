// Plans, seat limits and subscription gating — pure functions, no I/O.
// Pricing rule (operator standard): every feature in every plan; plans differ
// ONLY by seats. Limits are SOFT by default: crossing a seat cap warns and
// lets the action finish; it never blocks.

export const PLANS = {
  starter: { id: 'starter', name: 'Starter', priceMonthly: 79, seats: 5 },
  pro: { id: 'pro', name: 'Pro', priceMonthly: 199, seats: 15 },
  premium: { id: 'premium', name: 'Premium', priceMonthly: 449, seats: 40 },
};

export const TRIAL_DAYS = 14;

export function getPlan(planId) {
  return PLANS[planId] || PLANS.starter;
}

// Seat check for adding one more member.
// Returns { seatsUsed, seatsAllowed, overLimit, warning }.
// In soft mode overLimit is informational only — callers must not block on it.
export function seatCheck(planId, currentUserCount, limitsMode = 'soft') {
  const plan = getPlan(planId);
  const seatsUsed = currentUserCount + 1; // after the add
  const overLimit = seatsUsed > plan.seats;
  return {
    seatsUsed,
    seatsAllowed: plan.seats,
    overLimit,
    blocked: limitsMode === 'hard' ? overLimit : false,
    warning: overLimit
      ? `Seat limit for the ${plan.name} plan is ${plan.seats}; you now have ${seatsUsed}. ` +
        'Soft limits: the member was added anyway — upgrade the plan to remove this warning.'
      : null,
  };
}

// Subscription gate decision for app APIs.
// allow: trialing (trial still running) or active.
// deny:  no subscription, trial expired, canceled, expired.
// past_due is allowed (grace) — the operator fixes billing, learners keep working.
export function gateDecision(subscription, now = new Date()) {
  if (!subscription) return { allow: false, reason: 'no_subscription' };
  const status = subscription.status;
  if (status === 'active' || status === 'past_due') return { allow: true, reason: status };
  if (status === 'trialing') {
    const ends = subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
    if (ends && ends > now) return { allow: true, reason: 'trialing' };
    return { allow: false, reason: 'trial_expired' };
  }
  return { allow: false, reason: status }; // canceled | expired
}

// Paths that stay reachable even when the subscription gate denies access.
export function isGateExempt(pathname) {
  return (
    pathname === '/api/setup' ||
    pathname === '/api/signup' ||
    pathname === '/api/login' ||
    pathname === '/api/logout' ||
    pathname === '/api/me' ||
    pathname.startsWith('/api/billing')
  );
}
