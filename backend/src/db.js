// Real SQLite storage using Node's built-in node:sqlite module.
// This needs Node.js 22.5+ and requires NO native compiler, Python, or
// build tools — it ships inside Node itself. (Still labeled "experimental"
// by Node, but stable enough for this project.)
import { DatabaseSync } from "node:sqlite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// DATA_DIR lets you point the database at a mounted persistent volume when
// deploying (e.g. Railway) — without it, it just lives next to the backend
// code, which is fine for local development.
const dataDir = process.env.DATA_DIR || path.join(__dirname, "..");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, "data.sqlite");

export const db = new DatabaseSync(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS forms (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Untitled form',
  description TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  required INTEGER NOT NULL DEFAULT 0,
  options TEXT DEFAULT '[]',
  config TEXT DEFAULT '{}',
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS responses (
  id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL,
  submitted_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS answers (
  id TEXT PRIMARY KEY,
  response_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  value TEXT
);

CREATE INDEX IF NOT EXISTS idx_questions_form ON questions(form_id);
CREATE INDEX IF NOT EXISTS idx_responses_form ON responses(form_id);
CREATE INDEX IF NOT EXISTS idx_answers_response ON answers(response_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id);
`);

// Cascading deletes are done manually in the route handlers rather than via
// SQLite foreign keys, to keep behavior simple and explicit.
