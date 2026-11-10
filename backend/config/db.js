const mongoose = require('mongoose');
const dns = require('node:dns');

const { Schema } = mongoose;
const options = { versionKey: false, minimize: false };

const userSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true }, name: { type: String, required: true },
  username: { type: String, required: true, unique: true, index: true }, email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password_hash: { type: String, default: '' }, password_salt: { type: String, default: '' }, role: { type: String, default: 'student' },
  status: { type: String, default: 'active' }, google_id: { type: String, sparse: true, unique: true }, profile: { type: Schema.Types.Mixed, default: {} }, created_at: { type: String, required: true },
});
const adminSchema = new Schema({ email: { type: String, required: true, unique: true, lowercase: true }, name: { type: String, required: true }, role: { type: String, required: true }, password_hash: { type: String, required: true }, password_salt: { type: String, required: true }, google_id: { type: String, sparse: true, unique: true }, profile_picture: { type: String, default: '' } }, options);
const sessionSchema = new Schema({ token_hash: { type: String, required: true, unique: true, index: true }, user_id: { type: String, default: null, index: true }, admin_email: { type: String, default: null, index: true }, role: { type: String, required: true }, expires_at: { type: Number, required: true, index: true } }, options);
const userStateSchema = new Schema({ user_id: { type: String, required: true, unique: true, index: true }, data: { type: Schema.Types.Mixed, default: {} }, updated_at: { type: String, required: true } }, options);
const progressSchema = new Schema({ user_id: { type: String, required: true, index: true }, school_code: { type: String, required: true }, module_id: { type: String, required: true }, topic_id: { type: String, required: true }, status: { type: String, default: 'completed' }, completed_at: { type: String, required: true } }, options);
progressSchema.index({ user_id: 1, school_code: 1, module_id: 1, topic_id: 1 }, { unique: true });
const submissionSchema = new Schema({ id: { type: String, required: true, unique: true }, user_id: { type: String, required: true, index: true }, school_code: { type: String, required: true }, assignment_id: { type: String, required: true }, assignment_title: { type: String, required: true }, module_name: { type: String, required: true }, submission_text: { type: String, required: true }, submission_url: { type: String, default: '' }, status: { type: String, default: 'Submitted' }, admin_feedback: { type: String, default: '' }, score: { type: Number, default: null }, submitted_at: { type: String, required: true } }, options);
submissionSchema.index({ user_id: 1, assignment_id: 1 }, { unique: true });
const adminStorageSchema = new Schema({ key: { type: String, required: true, unique: true }, value: { type: Schema.Types.Mixed, default: null }, updated_at: { type: String, required: true } }, options);
const passwordResetSchema = new Schema({ email: { type: String, required: true, unique: true }, code_hash: { type: String, required: true }, expires_at: { type: Number, required: true, index: true } }, options);

const User = mongoose.model('User', userSchema);
const Admin = mongoose.model('Admin', adminSchema);
const Session = mongoose.model('Session', sessionSchema);
const UserState = mongoose.model('UserState', userStateSchema);
const StudentProgress = mongoose.model('StudentProgress', progressSchema);
const AssignmentSubmission = mongoose.model('AssignmentSubmission', submissionSchema);
const AdminStorage = mongoose.model('AdminStorage', adminStorageSchema);
const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);

async function connectDb() {
  const uri = String(process.env.MONGODB_URI || process.env.MONGO_URI || '').trim();
  if (!uri) throw new Error('Set MONGODB_URI in backend/.env before starting the server.');
  // Some Windows DNS forwarders refuse Node's SRV/TXT resolver requests even
  // when the same records are available through a public resolver. Allow an
  // explicit resolver list and default to Google/Cloudflare for Atlas SRV URIs.
  const dnsServers = String(process.env.MONGODB_DNS_SERVERS || '8.8.8.8,1.1.1.1')
    .split(',').map(server => server.trim()).filter(Boolean);
  if (uri.startsWith('mongodb+srv://') && dnsServers.length) dns.setServers(dnsServers);
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  } catch (error) {
    if (error?.code === 8000 || /bad auth|authentication failed/i.test(error?.message || '')) {
      throw new Error('MongoDB Atlas rejected the database user credentials. In Atlas > Database Access, reset the database user password and confirm the user has readWrite access to the CampusKnowledge database. Update MONGODB_URI in backend/.env (URL-encode special password characters), then restart.');
    }
    throw new Error(`MongoDB connection failed: ${error.message}`);
  }
  return mongoose.connection;
}

async function closeDb() { await mongoose.disconnect(); }
module.exports = { mongoose, connectDb, closeDb, User, Admin, Session, UserState, StudentProgress, AssignmentSubmission, AdminStorage, PasswordReset };
