# LearnConnect User Panel

A responsive, frontend-only learning community demo built with React, Vite and React Router.

The user panel and admin panel are part of this single frontend app. The user sign-in page is at `/login`; the separate admin sign-in page is at `/admin/login`.

## Run locally

```sh
npm install
npm run dev
```

Run the commands from the `frontend` folder. This starts one development server at `http://127.0.0.1:5173` for both panels.

The app stores demo content in browser `localStorage`. It does not require a backend. `src/state.jsx` includes an Axios client ready for a future API.

## Pages

Dashboard, Explore, Questions and answers, Discussions, Live sessions, Bookmarks, Contributions, Profile, Notifications and Settings.
