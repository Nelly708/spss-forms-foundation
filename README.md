# Forms — foundation

A self-hosted forms platform: Google-Forms-style visual design, Yandex-Forms-level
functionality (builder, response collection, matrix/grid questions), plus a
growing statistical-analysis layer aimed at becoming an SPSS-style tool for
your response data.

## Stack

- **Backend:** Node.js + Express + **real SQLite**, via Node's built-in
  `node:sqlite` module (`src/db.js`). This needs Node.js 22.5+ but **no
  native compiler, Python, or build tools** — it ships inside Node itself,
  so `npm install` never has to compile anything. (Node still labels it
  "experimental," but it's stable enough for this project. Swap it for
  `better-sqlite3` or Postgres later — the route files just call
  `db.prepare(...).run/get/all(...)`, so only `src/db.js` needs to change.)
- **Frontend:** React + Vite + React Router. No UI framework — plain CSS
  (`src/index.css`) styled to resemble Google Forms (purple accent, card layout).

## What's included

- **Form builder** (`/forms/:id/edit`) — add/edit/duplicate/delete questions,
  9 question types: short answer, paragraph, multiple choice, checkboxes,
  dropdown, linear scale, **matrix/grid (cross-tab)**, number, date.
- **Combined "choice + free text" answers** — any multiple-choice or
  checkbox question can enable an "Other" option (tick "Add 'Other'…" in the
  builder). Respondents either pick a listed option or type their own; both
  land in the same answer field, so stats treat them uniformly.
- **Matrix / grid questions** — define a set of row statements and column
  choices (e.g. rows = statements, columns = "yes/no" or a 1–5 scale) and
  respondents pick one column per row. This is the seed of proper
  cross-tabulation.
- **Reordering** — ▲▼ buttons on each question (move it up/down in the
  form) and on each option/matrix row/matrix column (reorder answers within
  a question).
- **Images in questions** — upload an image per question (stored as a data
  URL right in the question, no separate file storage needed); it shows
  above the question title for respondents.
- **Per-question fonts** — set a different font for a question's title vs.
  its description, from a small built-in list (no extra fonts to load).
- **Shuffled answer order** — toggle "Shuffle answer order" on any
  multiple-choice/checkbox/dropdown question to randomize the order options
  appear in for each respondent (an enabled "Other" option always stays
  last, same as Google Forms).
- **Public form viewer** (`/forms/:id/view`) — fill in and submit a form.
- **Response collection** — every submission is stored with per-question answers.
- **Statistics dashboard** (`/forms/:id/results`) — for each question, computed
  live from stored responses:
  - Numeric / scale: mean, median, mode, standard deviation, min, max
  - Multiple choice / checkbox / dropdown (including free-text "Other"
    answers): frequency table + mode, shown as bar chart
  - **Matrix**: a frequency table per row
  - Date: earliest / latest
  - Free text: average word count + sample answers
- **Two ready-made survey forms** — see "Seeding example forms" below.

This statistics module (`backend/src/utils/statistics.js`) is the natural place
to grow further SPSS-style features — cross-tabulation *between two different*
questions, correlation, chi-square tests, exporting a response matrix as CSV/SPSS `.sav`.

**Known limitations to be aware of:**
- No branching/skip logic yet ("if you answered X, skip to question N").
- A matrix row can't have its own free-text "Other" cell — only whole
  questions can.
- No authentication — anyone with a form's link can edit or delete it.
  Fix this before sharing broadly (see "Suggested next steps").

## Running it locally

You'll need **Node.js 22.5 or newer** (check with `node --version`; the
built-in SQLite module is why the version floor is higher than usual).

```bash
# Backend
cd backend
npm install
npm run dev        # starts the API on http://localhost:4000

# Frontend (in a second terminal)
cd frontend
npm install
npm run dev         # starts the dev server on http://localhost:5173
```

Open http://localhost:5173 — the Vite dev server proxies `/api` requests to
the backend automatically (see `frontend/vite.config.js`).

A `backend/data.sqlite` file is created automatically on first run and holds
all your forms, questions, and responses — back it up like any other file.

## Seeding example forms

Two real survey questionnaires are included as a seed script, transcribed
with the new matrix and "Other" question types:

```bash
cd backend
npm run seed
```

This adds **"Профессиональные ориентации студентов"** (28 questions, incl.
7 matrix/grid questions) and **"Отношение к дню рождения"** (35 questions,
mostly multiple-choice with free-text "Other") to your database. Open
http://localhost:5173 afterward to see them under "Your forms." Safe to run
once — running it again adds duplicate copies of both forms.

## Making it accessible to other people (via a tunnel)

Since this runs on your own machine, the simplest way to let anyone with a
link fill out a form — without deploying anywhere — is a tunnel like
[ngrok](https://ngrok.com):

1. Keep the backend and frontend both running (`npm run dev` in each, as above).
2. Install ngrok and run: `ngrok http 5173`
   (`frontend/vite.config.js` is already set up to accept tunnel traffic —
   see the `host`/`allowedHosts` settings there.)
3. Ngrok prints an `https://...ngrok-free.app` URL — share that. Visitors
   hit your Vite dev server through the tunnel, which proxies `/api` calls
   to your backend on `localhost:4000` automatically, exactly like it does
   for you locally.
4. The link stays live only as long as your computer, the backend, the
   frontend, and the ngrok process are all running. Closing any of them
   breaks the link. Free ngrok links also change every time you restart it.

**Before sending this link around:** there's no login system yet, so anyone
with the *builder* link (`/forms/:id/edit`) can edit or delete the form —
only share the *viewer* link (`/forms/:id/view`) publicly. Add authentication
first if that's a concern (see "Suggested next steps").

## A link that works even when your computer is off (real deployment)

A tunnel only works while your PC, the app, and the tunnel are all running.
For a link that works anytime — deployed once, then always on — use a real
host. The project is already set up to deploy as **one single app** to
[Railway](https://railway.app) (free trial credit, no credit card to start,
and it gives your SQLite database a place to actually persist data — most
free hosts wipe local files on every restart).

1. **Install the Railway CLI** and log in (opens your browser to sign up/log in):
   ```bash
   npm install -g @railway/cli
   railway login
   ```
2. **From the `spss-forms` folder** (the one containing both `backend` and
   `frontend`), create a new Railway project and deploy:
   ```bash
   railway init
   railway up
   ```
   Railway will detect the root `package.json`, run its `build` script
   (which installs both `backend` and `frontend` and builds the frontend),
   then run `start` (which launches the backend — and the backend now also
   serves the built frontend, so it's one URL for everything).
3. **Add a persistent volume** so your data survives restarts/redeploys:
   in the Railway dashboard, open your service → **Settings → Volumes** →
   add a volume mounted at `/data`. Then go to **Variables** and add
   `DATA_DIR` = `/data`.
4. **Generate a public URL**: in the dashboard, **Settings → Networking →
   Generate Domain**. You'll get a permanent `https://your-app.up.railway.app`
   link.
5. Once it's deployed, run the seed script against the *deployed* database
   if you want the two example forms there too — easiest way is to open a
   shell into the deployed service from the Railway dashboard and run
   `npm run seed --prefix backend`, or just recreate the forms by hand in
   the deployed app's builder.
6. Share `https://your-app.up.railway.app/forms/<id>/view` — this now works
   for anyone, anytime, with your computer fully turned off.

This costs nothing to start (Railway's trial credit), but will eventually
need a paid plan for continued use — check Railway's current pricing.
Render, Fly.io, and a small VPS are alternatives with a similar shape
(persistent volume + one deployed Node service); ask if you'd like the
equivalent steps for one of those instead.

### Deploying backend and frontend as two SEPARATE services instead

Render (and some other hosts) make it easy to deploy the backend as a "Web
Service" and the frontend as a separate "Static Site." This works, but
needs two extra things the combined-app approach above doesn't:

1. **Tell the frontend where the backend lives.** `frontend/src/api.js`
   reads `VITE_API_BASE` at build time. Set an environment variable named
   `VITE_API_BASE` on the frontend's Render service to your backend's full
   URL (e.g. `https://spss-forms-backend1.onrender.com`, no trailing
   slash), then trigger a rebuild — Vite only bakes env vars in at build
   time, so changing it always requires a rebuild, not just a restart.
2. **Add a rewrite rule for client-side routing.** This app uses React
   Router, so URLs like `/forms/abc123/edit` only exist in the browser, not
   as real files. On Render's Static Site settings, add a Rewrite Rule:
   Source `/*` → Destination `/index.html` → Action `Rewrite`. Without
   this, refreshing any page except the homepage gives a 404.

The combined single-service approach above avoids both of these issues
entirely (same origin, and the backend's catch-all route already serves
`index.html` for every path) — it's the simpler option unless you have a
specific reason to run them separately.

## Project structure

```
spss-forms/
  package.json        # root build/start scripts, used only for deployment
  backend/
    src/
      server.js        # Express app entry point
      db.js             # SQLite schema + connection (node:sqlite)
      seed.js            # populates two example survey forms
      routes/
        forms.js        # CRUD for forms + questions
        responses.js     # submit / list responses
        stats.js          # descriptive statistics per question
      utils/
        statistics.js    # mean/median/mode/stdev/frequency/matrix helpers
  frontend/
    src/
      pages/
        Home.jsx         # list & create forms
        FormBuilder.jsx  # question editor
        FormViewer.jsx   # public fill-in
        FormResults.jsx  # stats dashboard
      components/
        QuestionEditor.jsx    # editor UI for one question (incl. matrix/other)
        QuestionRenderer.jsx  # fill-in UI for one question (incl. matrix/other)
        StatBar.jsx            # frequency bar
      api.js            # fetch wrapper for the backend API
      questionTypes.js  # shared question type definitions
      index.css          # Google-Forms-inspired styling
```

## Suggested next steps

1. **Skip/branching logic** — several source questionnaires used "if you
   answered X, skip to question N"; worth adding as a `config.skipRules`
   on questions plus logic in `FormViewer.jsx`.
2. **Drag-and-drop reordering** in the builder (currently questions are in
   creation order — add a small drag library like `@dnd-kit/core`).
3. **Auth** — add user accounts and ownership checks in the route handlers.
4. **CSV / SPSS export** — add a `GET /api/forms/:id/export.csv` route that
   flattens `answers` into a response-by-question matrix.
5. **Cross-tabulation & correlation between two questions** — extend
   `statistics.js` with functions that take two question IDs and compute a
   contingency table or Pearson r.
6. **Charts** — swap the plain CSS bars for a charting library (e.g. Chart.js
   or Recharts) once you want richer visualizations.
