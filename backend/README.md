# LearnConnect backend

## Run

From this directory, set `MONGODB_URI`, `ADMIN_EMAIL`, `ADMIN_NAME`, and a strong `ADMIN_PASSWORD` in `.env`, then run `npm run dev`. The backend API listens on `http://localhost:5001`. Run the separate Vite frontend from `frontend/` with `npm run dev`; it listens on `http://localhost:5173`. The configured administrator account is provisioned on startup; there are no demo credentials.

## Project layout

- `server.js` starts the HTTP server and serves the frontend.
- `routes/` selects the API route group: authentication, user state, or admin operations.
- `controllers/` contains separate authentication, user-state, and admin handlers.
- `services/appService.js` holds shared authentication, validation, state, and sync logic.
- `config/db.js` connects to MongoDB and defines the application collections.
- `config/env.js` loads the local `.env` file.
- `utils/http.js` contains shared HTTP response and JSON body helpers.
- MongoDB stores users, sessions, user state, progress, assignment submissions, and admin settings.

The backend uses MongoDB. You can use a local MongoDB server or MongoDB Atlas. Set `MONGODB_URI` in `backend/.env`; the server will fail to start if it cannot connect.

If you have existing data in `backend/data/learnconnect.sqlite`, back up that file and `.env`, configure `MONGODB_URI`, then run `npm run migrate:sqlite` once from this directory. The migration imports existing collections without deleting the SQLite source. New app writes go to MongoDB.

## Google sign-in

Create a Google OAuth **Web application** client in Google Cloud Console. Add `http://localhost:5173` to Authorized JavaScript origins. Copy its client ID to `backend/.env` as `GOOGLE_CLIENT_ID` and `frontend/.env` as `VITE_GOOGLE_CLIENT_ID`, then restart both servers. The client ID is public configuration; never put a Google client secret in frontend variables. Google ID tokens are verified server-side with Google's auth library. The backend links verified emails to existing accounts, stores the Google subject and profile picture, and issues a signed application JWT tracked in the existing revocable session table.

Set `JWT_SECRET` in `backend/.env` to a unique random value of at least 32 characters. A local value is generated when this feature is installed; replace it with a deployment secret manager value in production. `frontend/.env.example` and `backend/.env.example` contain placeholders only; never commit `.env` files.

Google login on `/admin/login` only succeeds when the verified Google email already belongs to an administrator provisioned by `ADMIN_EMAIL`. A Google login can create a student account; it cannot grant administrator permissions.

User passwords continue to be stored as salted hashes. MongoDB connection credentials must stay in `backend/.env` and must not be committed.

## Create Google Meet links for sessions

Student and admin session forms can create a scheduled Google Calendar event with a unique Google Meet room. Set `VITE_GOOGLE_CLIENT_ID` in `frontend/.env` to the same Web OAuth client ID used by `GOOGLE_CLIENT_ID`. In Google Cloud, enable the Google Calendar API for that project and add `http://localhost:5173` to the OAuth client's Authorized JavaScript origins. If the OAuth consent screen's publishing status is **Testing**, add the Google account that will create the Meet as a test user. When a host clicks **Create Google Meet link**, Google asks for permission to create events on calendars they own; after approval, the event and Meet URL are created on that host's primary calendar and the URL is filled into the session form. The host then saves the session in LearnConnect.
