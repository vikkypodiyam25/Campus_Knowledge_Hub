const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const dataDir = path.resolve(__dirname, '..', 'data');
const dbFile = path.join(dataDir, 'learnconnect.sqlite');
fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(dbFile);
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    status TEXT NOT NULL DEFAULT 'active',
    google_id TEXT,
    profile TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS admins (
    email TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    google_id TEXT,
    profile_picture TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    admin_email TEXT REFERENCES admins(email) ON DELETE CASCADE,
    role TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS user_states (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS student_progress (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school_code TEXT NOT NULL,
    module_id TEXT NOT NULL,
    topic_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed',
    completed_at TEXT NOT NULL,
    PRIMARY KEY (user_id, school_code, module_id, topic_id)
  );
  CREATE INDEX IF NOT EXISTS idx_student_progress_school ON student_progress(user_id, school_code);
  CREATE TABLE IF NOT EXISTS assignment_submissions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school_code TEXT NOT NULL,
    assignment_id TEXT NOT NULL,
    assignment_title TEXT NOT NULL,
    module_name TEXT NOT NULL,
    submission_text TEXT NOT NULL,
    submission_url TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Submitted',
    admin_feedback TEXT NOT NULL DEFAULT '',
    score INTEGER,
    submitted_at TEXT NOT NULL,
    UNIQUE(user_id, assignment_id)
  );
  CREATE INDEX IF NOT EXISTS idx_assignment_submissions_review ON assignment_submissions(status, submitted_at DESC);
  CREATE TABLE IF NOT EXISTS admin_storage (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS password_resets (
    email TEXT PRIMARY KEY,
    code_hash TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );
`);

function ensureColumn(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some(item => item.name === column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

ensureColumn('users', 'google_id', 'TEXT');
ensureColumn('admins', 'google_id', 'TEXT');
ensureColumn('admins', 'profile_picture', "TEXT NOT NULL DEFAULT ''");
db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_google_id ON admins(google_id) WHERE google_id IS NOT NULL;
`);

function withTransaction(callback) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = callback();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

module.exports = { db, dbFile, withTransaction };
