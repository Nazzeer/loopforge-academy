// Password hashing (PBKDF2 via WebCrypto) and session-token hashing.
// Pure WebCrypto only — runs identically in Workers and in Node >= 19,
// which is what tests/run.mjs relies on.

const PBKDF2_ITERATIONS = 100000;
const enc = new TextEncoder();

function toBase64(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function fromBase64(b64) {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

async function pbkdf2(password, saltBytes, iterations) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations },
    key,
    256
  );
  return new Uint8Array(bits);
}

// Returns { hash, salt, iterations } — store all three on the user row.
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return { hash: toBase64(hash), salt: toBase64(salt), iterations: PBKDF2_ITERATIONS };
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function verifyPassword(password, stored) {
  if (!stored || !stored.hash || !stored.salt) return false;
  const iterations = stored.iterations || PBKDF2_ITERATIONS;
  const derived = await pbkdf2(password, fromBase64(stored.salt), iterations);
  return constantTimeEqual(derived, fromBase64(stored.hash));
}

// Session tokens: the raw token goes in the cookie; only its SHA-256 hash
// is stored in D1, so a database leak does not leak live sessions.
export async function hashToken(token) {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(token));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function newSessionToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}
