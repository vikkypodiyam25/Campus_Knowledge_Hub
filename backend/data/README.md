# Persistent application data

The backend creates `learnconnect.sqlite` in this directory when it starts. Accounts, password hashes, sessions, user state, and admin panel data are stored in that SQLite database. The database and SQLite journal files are ignored by Git; keep a separate backup if you need to preserve live data.
