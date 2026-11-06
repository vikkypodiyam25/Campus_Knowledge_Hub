require('../config/env')();

const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { connectDb, closeDb, User, Admin, Session, UserState, StudentProgress, AssignmentSubmission, AdminStorage, PasswordReset } = require('../config/db');

function rows(sqlite, table) {
  return sqlite.prepare(`SELECT * FROM ${table}`).all();
}

async function importRows(Model, documents, map = value => value) {
  if (!documents.length) return 0;
  const mapped = documents.map(map);
  const operations = mapped.map(document => {
    const filter = Model.modelName === 'StudentProgress'
      ? { user_id: document.user_id, school_code: document.school_code, module_id: document.module_id, topic_id: document.topic_id }
      : { [Model.modelName === 'User' || Model.modelName === 'AssignmentSubmission' ? 'id' : Model.modelName === 'Admin' || Model.modelName === 'PasswordReset' ? 'email' : Model.modelName === 'Session' ? 'token_hash' : Model.modelName === 'UserState' ? 'user_id' : 'key']: document[Model.modelName === 'User' || Model.modelName === 'AssignmentSubmission' ? 'id' : Model.modelName === 'Admin' || Model.modelName === 'PasswordReset' ? 'email' : Model.modelName === 'Session' ? 'token_hash' : Model.modelName === 'UserState' ? 'user_id' : 'key'] };
    return { updateOne: { filter, update: { $set: document }, upsert: true } };
  });
  await Model.bulkWrite(operations, { ordered: false });
  return mapped.length;
}

async function main() {
  const sqlitePath = path.resolve(__dirname, '..', 'data', 'learnconnect.sqlite');
  const sqlite = new DatabaseSync(sqlitePath, { readOnly: true });
  try {
    await connectDb();
    let total = 0;
    total += await importRows(User, rows(sqlite, 'users'), user => ({ ...user, profile: JSON.parse(user.profile || '{}') }));
    total += await importRows(Admin, rows(sqlite, 'admins'));
    total += await importRows(Session, rows(sqlite, 'sessions'));
    total += await importRows(UserState, rows(sqlite, 'user_states'), state => ({ ...state, data: JSON.parse(state.data || '{}') }));
    total += await importRows(StudentProgress, rows(sqlite, 'student_progress'));
    total += await importRows(AssignmentSubmission, rows(sqlite, 'assignment_submissions'));
    total += await importRows(AdminStorage, rows(sqlite, 'admin_storage'), item => ({ ...item, value: JSON.parse(item.value || 'null') }));
    total += await importRows(PasswordReset, rows(sqlite, 'password_resets'));
    console.log(`Imported or updated ${total} records in MongoDB. SQLite source was left unchanged.`);
  } finally {
    sqlite.close();
    await closeDb();
  }
}

main().catch(error => {
  console.error(`SQLite migration failed: ${error.message}`);
  process.exitCode = 1;
});
