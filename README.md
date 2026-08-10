# Medly — React + Vite + Tailwind

A rebuild of the Medly layout as a real React app. Same structure and design system as the
original; all copy lives in one file so you can swap in your own content.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to dist/
```

## Make it yours — two files

**`src/data/content.ts`** — every heading, card, list and label on all seven pages.
Edit the values, the components adapt. Add or remove array items freely; grids reflow.

**`src/config/site.ts`** — app name, logo initial, and the sidebar nav items.

For colours, open **`src/index.css`** and change the HSL triplets under `:root`.
Everything is derived from them, so changing `--primary` re-themes the whole app.

```css
--primary: 174 72% 40%;   /* teal  → try 221 83% 53% for blue */
--accent:  12 85% 62%;    /* coral */
--radius:  0.75rem;
```

## Structure

```
src/
  config/site.ts            branding + nav
  data/content.ts           all page content
  index.css                 design tokens, fonts, component classes
  lib/utils.ts              cn() class merger
  components/
    layout/
      AppLayout.tsx         sidebar + mobile nav + content slot
      Sidebar.tsx           desktop sidebar (md and up)
      MobileNav.tsx         bottom tab bar (below md)
      PageHeader.tsx        shared title/subtitle/action row
    ui/                     button, card, badge, input, progress, avatar
  pages/                    Home, Dashboard, Library, Community,
                            Challenges, Premium, Profile
public/
  fonts/                    Inter 300–700, Plus Jakarta Sans 500–700 (self-hosted)
  avatar.jpg
```

## Routes

| Path | Page | Layout |
|---|---|---|
| `/` | Home | standalone marketing page, own top nav |
| `/dashboard` | Dashboard | app shell |
| `/community` | Community | app shell |
| `/challenges` | Challenges | app shell |
| `/library` | Library | app shell |
| `/premium` | Premium | app shell |
| `/profile` | Profile | app shell |

## What works

Unlike the static capture, the interactions are wired up with React state:

- Dashboard — feed search, category filters, like and bookmark toggles
- Library — search, category filter tiles (click to filter, click again to clear)
- Community — search, filter tabs, join/leave per community
- Challenges — join/leave, progress bars derived from participant counts
- Premium — plan selection
- Sidebar and tab bar — active route highlighting via `NavLink`

## Notes

- Icons are `lucide-react`, imported per-icon so only what you use is bundled.
- Fonts are self-hosted in `public/fonts` — no external requests, no layout shift.
- No dark theme yet. To add one, define a `.dark` block in `index.css` overriding
  the same variables and toggle the class on `<html>`.
- Deploying to a static host: the app uses `BrowserRouter`, so configure a
  catch-all rewrite to `/index.html` (Netlify `_redirects`, Vercel `rewrites`,
  or `try_files` in nginx). Otherwise use `HashRouter`.

---

## Connecting to the API

The app talks to the FastAPI backend in `../backend`. Start it first:

```bash
cd ../backend && uvicorn app.main:app --reload
```

Point the frontend elsewhere with `VITE_API_URL` in `.env` (see `.env.example`).
Default is `http://localhost:8000`.

Pages that need the API: **AI Training** (`/learn`), **Governance** (`/governance`),
**Login** (`/login`), and the assistant widget. The original pages — Dashboard,
Library, Community, Challenges, Premium, Profile — still render from
`src/data/content.ts` with no backend.

Auth token is kept in `localStorage` under `medly.token`.
