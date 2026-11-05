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

Create a Google OAuth **Web application** client in Google Cloud Console. Add the app origin (for local development, the exact `http://127.0.0.1:<port>` URL printed by the backend) to its Authorized JavaScript origins. Copy the client ID to both `backend/.env` as `GOOGLE_CLIENT_ID` and `frontend/.env` as `VITE_GOOGLE_CLIENT_ID`, then restart the backend. The ID is public configuration; never put a Google client secret in frontend environment variables. Google identity tokens are verified by the backend before a LearnConnect session is issued.
