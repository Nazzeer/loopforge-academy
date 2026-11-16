-- Loopforge Academy — initial schema (0001)
-- Applied idempotently by POST /api/setup. Never deletes data.

CREATE TABLE IF NOT EXISTS organisations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id INTEGER NOT NULL REFERENCES organisations(id),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'learner' CHECK (role IN ('admin','learner')),
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  password_iterations INTEGER NOT NULL DEFAULT 100000,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_org ON users(org_id);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id INTEGER NOT NULL UNIQUE REFERENCES organisations(id),
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter','pro','premium')),
  status TEXT NOT NULL DEFAULT 'trialing'
    CHECK (status IN ('trialing','active','past_due','canceled','expired')),
  trial_ends_at TEXT,
  current_period_end TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS modules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  concepts TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id INTEGER NOT NULL REFERENCES modules(id),
  title TEXT NOT NULL,
  body_md TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id);

CREATE TABLE IF NOT EXISTS progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  module_id INTEGER NOT NULL REFERENCES modules(id),
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started','in_progress','submitted','done','returned')),
  evidence_text TEXT NOT NULL DEFAULT '',
  review_note TEXT NOT NULL DEFAULT '',
  reviewed_by INTEGER,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, module_id)
);
CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id);

CREATE TABLE IF NOT EXISTS coach_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_coach_user_time ON coach_messages(user_id, created_at);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id INTEGER,
  user_id INTEGER,
  action TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_log(org_id, created_at);

-- Seed: 6 modules + capstone (titles/concepts from the Loops & Graphs curriculum).
INSERT OR IGNORE INTO modules (slug, title, concepts, position) VALUES
  ('module-1-loop-and-check', 'Module 1 — The Loop and the Check',
   'Produce → check → fix → repeat; evidence ranking (tests > schema > diff > reviewer opinion); write the check before the task.', 1),
  ('module-2-stop-conditions', 'Module 2 — Stop Conditions and Budgets',
   'Done-test, round limit, budget, memory of past attempts (including rejected findings), dry-round stopping (2 rounds with nothing new = stop).', 2),
  ('module-3-first-graph', 'Module 3 — Your First Graph',
   'Nodes and edges; the 4-line node contract (NODE / JOB / IN / OUT / CHECK / ON FAIL); cutting arrows that carry nothing; the four shapes (chain, fan-out+join, router, loop).', 3),
  ('module-4-gates-by-reversibility', 'Module 4 — Gates by Reversibility',
   'Gate on how hard a mistake is to undo, not on model confidence; human interrupts in the graph; evidence order at the gate (tests → diff → interface → opinion); strongest model on the gate.', 4),
  ('module-5-failure-rules', 'Module 5 — Failure Rules and Send-Back',
   'RETRY / FALLBACK / SKIP decided in advance; send back the unit, not the batch (failing test + evidence + tight scope); turn every fixed failure into a written rule.', 5),
  ('module-6-tool-stack', 'Module 6 — The Tool Stack in Practice',
   '/goal and /loop in Claude Code; when LangGraph, Pydantic Graph, CrewAI Flows, Apache Burr or DSPy each earn their place; smallest model that clears the bar per node.', 6),
  ('capstone-ship-it', 'Capstone — Ship It',
   'Redesign one full agent lane as a checked loop inside a gated graph, deploy it, and verify it live on real data, approving only the gated step.', 7);
