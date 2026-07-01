# cutShort — Frontend

Next.js 16 (App Router) + TypeScript + Tailwind CSS frontend for the cutShort URL shortener.
Talks to the Spring Boot backend over a plain JSON REST API (see [`../backend/README.md`](../backend/README.md)).

## Stack

- **Next.js 16** — App Router, client components (`"use client"`) throughout; no server actions
- **React 19**, **TypeScript**
- **Tailwind CSS** — dark theme, utility classes only, no component library
- Auth state lives in `lib/auth-context.tsx` (JWT stored client-side); `lib/api.ts` is the only
  place that talks to the backend

> **Note:** this repo pins a newer Next.js than most training data has seen. If an API doesn't
> behave the way you expect, check `node_modules/next/dist/docs/` before assuming it's a bug.

## Running locally

```bash
npm install
npm run dev
```

Requires the backend running (see root README) and `NEXT_PUBLIC_API_URL` pointed at it —
defaults to `http://localhost:8080` if unset (`.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Pages

| Route | Auth | Description |
|---|---|---|
| `/` | any | Marketing/landing page + the shorten form (works signed out or in) |
| `/login`, `/register` | signed out | Auth forms |
| `/dashboard` | user | Link list (extend/customize/delete) + an analytics tab (click charts, expiry timeline, status breakdown) |
| `/dashboard/admin` | `ROLE_ADMIN` | Org-wide stats, per-user drill-down, promote/remove users, and the Gemini latency insight panel |

## AI features (Gemini, via the backend)

The frontend never talks to Gemini directly — it calls two backend endpoints
(`lib/api.ts`: `urls.suggestCode`, `admin.latencyInsight`) that wrap Gemini 2.5 Flash server-side.

- **Slug suggestions** (`app/page.tsx`) — as you type a URL into the shorten form, a debounced
  (700ms) call to `/api/urls/suggest-code` fetches up to 3 memorable slug ideas, rendered as
  chips below the input. Chips are only clickable when signed in (custom codes require auth on
  the backend); signed-out users see them muted with a "sign in to use one" nudge. If Gemini
  is unconfigured or fails, the chips row simply doesn't render — no error shown.
- **Latency insight** (`app/dashboard/admin/page.tsx`) — the admin dashboard fetches
  `/api/admin/latency-insight` on load (and on manual "Refresh") and renders sample
  count/avg/p95/max stat cards plus Gemini's natural-language health summary in a violet
  callout box.

## Project layout

```
frontend/
├── app/
│   ├── page.tsx               # landing page + shorten form + AI slug suggestions
│   ├── login/, register/      # auth forms
│   └── dashboard/
│       ├── page.tsx           # user's link list + analytics tab
│       └── admin/page.tsx     # admin dashboard + latency insight panel
├── components/
│   └── Navbar.tsx
└── lib/
    ├── api.ts                 # typed fetch wrapper — the only place that calls the backend
    └── auth-context.tsx       # JWT auth state (React context)
```

## Build

```bash
npm run build
```
