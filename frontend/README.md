# LearnConnect

The user panel and admin panel share one React frontend. User accounts, password resets, panel state and admin data are stored by the Node backend in a local SQLite database.

## Run the full app

Use Node.js 22.13 or newer. From this `frontend` folder, run:

```powershell
npm run dev
```

This starts the backend API and frontend together on the **same port**. Open the URL printed in the terminal (normally `http://127.0.0.1:5000`; if that port is busy, the app selects the next free port). Press `Ctrl+C` in that terminal to stop the app.

User login is at `/login`; admin login is at `/admin/login`. Configure `ADMIN_EMAIL`, `ADMIN_NAME`, and a strong `ADMIN_PASSWORD` in `backend/.env` to provision the administrator account. No default admin credentials are created.

## Data and production preview

The database is created at `backend/data/learnconnect.sqlite` and survives server restarts. It is ignored by Git. User passwords are scrypt-hashed; sessions, user state, admin data and audit-style content sync are stored server-side. Authenticated user actions (create posts/sessions, replies, votes, bookmarks, profile/preferences and notifications) are validated and applied by `POST /api/state/actions` before SQLite is updated. The browser keeps only a local display cache.

`MONGODB_URI` is kept in `backend/.env.example` for reference, but the active backend currently uses SQLite and does not connect to MongoDB. Admin users, question/discussion moderation, sessions and current dashboard metrics are connected. Report intake, notifications, category management and admin account editing still require backend implementation.

To serve a production build on one port:

```powershell
npm run build
cd ..\backend
npm start
```

Then open the URL printed by the backend (normally `http://127.0.0.1:5000`). In development, the backend runs the Vite frontend through middleware on its own port. For production, create `backend/.env`, set `NODE_ENV=production`, and configure `ADMIN_EMAIL`, `ADMIN_NAME`, and a strong `ADMIN_PASSWORD` before starting the backend.

Password reset currently returns a local development code in the UI because no email provider is configured. Add an email service to deliver reset codes to users.
