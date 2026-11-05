# LearnConnect backend

## Run

From this directory, set `ADMIN_EMAIL`, `ADMIN_NAME`, and a strong `ADMIN_PASSWORD` in `.env`, then run `npm run dev`. The backend serves the frontend on the same port. The configured administrator account is provisioned on startup; there are no demo credentials.

## Project layout

- `server.js` starts the HTTP server and serves the frontend.
- `routes/` selects the API route group: authentication, user state, or admin operations.
- `controllers/` contains separate authentication, user-state, and admin handlers.
- `services/appService.js` holds shared authentication, validation, state, and sync logic.
- `config/db.js` opens SQLite and creates the tables.
- `config/env.js` loads the local `.env` file.
- `utils/http.js` contains shared HTTP response and JSON body helpers.
- `data/learnconnect.sqlite` is the persistent application database.

The active backend uses SQLite. `MONGODB_URI` is only a saved setting for reference; it is not connected by this server.

## Google sign-in

Create a Google OAuth **Web application** client in Google Cloud Console. Add the exact app origin (for local development, the `http://127.0.0.1:<port>` URL printed by the backend) to Authorized JavaScript origins. Copy its client ID to `backend/.env` as `GOOGLE_CLIENT_ID` and `frontend/.env` as `VITE_GOOGLE_CLIENT_ID`, then restart the backend. The client ID is public configuration; never put a Google client secret in frontend variables. Google ID tokens are verified server-side with Google's auth library. The backend links verified emails to existing accounts, stores the Google subject and profile picture, and issues a signed application JWT tracked in the existing revocable session table.

Set `JWT_SECRET` in `backend/.env` to a unique random value of at least 32 characters. A local value is generated when this feature is installed; replace it with a deployment secret manager value in production. `frontend/.env.example` and `backend/.env.example` contain placeholders only; never commit `.env` files.

Google login on `/admin/login` only succeeds when the verified Google email already belongs to an administrator provisioned by `ADMIN_EMAIL`. A Google login can create a student account; it cannot grant administrator permissions.

The requested `MONGO_URI` is documented in the example for a future migration, but this project currently uses SQLite. This integration stores the Google ID and picture in the existing SQLite records to preserve current user state and admin features; it does not connect to MongoDB.
