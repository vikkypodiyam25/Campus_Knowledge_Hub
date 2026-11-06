# Persistent application data

This directory can contain a legacy `learnconnect.sqlite` database from earlier versions. The active backend stores new accounts, sessions, user state, and admin data in MongoDB. To import legacy records, configure `MONGODB_URI` and run `npm run migrate:sqlite` from the backend directory. The migration leaves the SQLite source untouched.
